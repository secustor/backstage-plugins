import {
  AuthService,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'node:crypto';

// TODO replace with your own imports
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { createServer } from './services/mcpService/server.ts';

export async function createRouter(opts: {
  auth: AuthService;
  discovery: DiscoveryService;
  logger: LoggerService;
  httpAuth: HttpAuthService;
}): Promise<express.Router> {
  const { logger } = opts;
  const router = Router();

  // copied from the example server to support both the new streamable and http+SSE transports
  // https://github.com/modelcontextprotocol/typescript-sdk/blob/747369476ae618b28bf8b6df0b33109dc10f4ad6/src/examples/server/sseAndStreamableHttpCompatibleServer.ts

  // Store transports by session ID
  const transports: Record<
    string,
    StreamableHTTPServerTransport | SSEServerTransport
  > = {};

  //= ============================================================================
  // STREAMABLE HTTP TRANSPORT (PROTOCOL VERSION 2025-03-26)
  //= ============================================================================

  // Handle all MCP Streamable HTTP requests (GET, POST, DELETE) on a single endpoint
  router.all('/mcp', async (req, res) => {
    console.log(`Received ${req.method} request to /mcp`);

    try {
      // Check for existing session ID
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        // Check if the transport is of the correct type
        const existingTransport = transports[sessionId];
        if (existingTransport instanceof StreamableHTTPServerTransport) {
          // Reuse existing transport
          transport = existingTransport;
        } else {
          // Transport exists but is not a StreamableHTTPServerTransport (could be SSEServerTransport)
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message:
                'Bad Request: Session exists but uses a different transport protocol',
            },
            id: null,
          });
          return;
        }
      } else if (
        !sessionId &&
        req.method === 'POST' &&
        isInitializeRequest(req.body)
      ) {
        const eventStore = new InMemoryEventStore();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          eventStore, // Enable resumability
          onsessioninitialized: localSessionId => {
            // Store the transport by session ID when session is initialized
            console.log(
              `StreamableHTTP session initialized with ID: ${sessionId}`,
            );
            transports[localSessionId] = transport;
          },
        });

        // Set up onclose handler to clean up transport when closed
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            console.log(
              `Transport closed for session ${sid}, removing from transports map`,
            );
            delete transports[sid];
          }
        };

        // Connect the transport to the MCP server
        const server = createServer(opts);
        await server.connect(transport);
      } else {
        // Invalid request - no session ID or not initialization request
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
        return;
      }

      // Handle the request with the transport
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  //= ============================================================================
  // DEPRECATED HTTP+SSE TRANSPORT (PROTOCOL VERSION 2024-11-05)
  //= ============================================================================

  router.get('/sse', async (_req, res) => {
    logger.warn('Received GET request to /sse (deprecated SSE transport)');
    // we need to use the correct path
    const transport = new SSEServerTransport('/api/mcp-wrapper/messages', res);
    transports[transport.sessionId] = transport;
    res.on('close', () => {
      delete transports[transport.sessionId];
    });
    const server = createServer(opts);
    await server.connect(transport);
  });

  router.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    let transport: SSEServerTransport;
    const existingTransport = transports[sessionId];
    if (existingTransport instanceof SSEServerTransport) {
      // Reuse existing transport
      transport = existingTransport;
    } else {
      // Transport exists but is not a SSEServerTransport (could be StreamableHTTPServerTransport)
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message:
            'Bad Request: Session exists but uses a different transport protocol',
        },
        id: null,
      });
      return;
    }
    if (transport) {
      await transport.handlePostMessage(req, res, req.body);
    } else {
      res.status(400).send('No transport found for sessionId');
    }
  });

  return router;
}
