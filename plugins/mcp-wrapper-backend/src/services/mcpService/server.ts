import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { RenovateClient } from '@secustor/backstage-plugin-renovate-client';
import {
  AuthService,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';

export interface ServerOptions {
  auth: AuthService;
  discovery: DiscoveryService;
  logger: LoggerService;
}

export function createServer(opts: ServerOptions): McpServer {
  const { logger, discovery } = opts;
  const server = new McpServer({
    name: 'backstage-mcp-wrapper',
    version: '1.0.0',
  });

  // create renovate client
  const client = new RenovateClient({
    discoveryApi: discovery,
  });

  // server.resource("renovate", "renovate://reports", async () => {
  //     const token = await getAuthToken(opts.auth);
  //     const response = await client.reportsGet({}, token)
  //     const body = await response.json()
  //
  //     const contents = body.map((value) => ({
  //       uri: `renovate://reports/${value.host}/${value.repository}`,
  //         mimeType: "application/json",
  //         text: JSON.stringify(value)
  //     }))
  //     return {
  //         contents
  //     }
  // })

  server.resource(
    'renovate',
    new ResourceTemplate('renovate://reports/{host}/{repository}', {
      list: async _extra => {
        const token = await getAuthToken(opts.auth);

        // TODO: this is a workaround to get the host and repository from the request
        // should be replaced with a better way to get the host and repository
        const response = await client.reportsGet({}, token);
        const body = await response.json();

        const resources = body.map(value => ({
          uri: `renovate://reports/${encodeURIComponent(value.host)}/${encodeURIComponent(value.repository)}`,
          name: `Renovate report ${value.host}/${value.repository}`,
          description:
            'Contains information of dependencies extracted from the repository, the update status, open PRs, branches and problems found in regard to Renovate',
          mimeType: 'application/json',
        }));
        return {
          resources,
        };
      },
    }),
    async (_uri, { host, repository }) => {
      const token = await getAuthToken(opts.auth);
      if (typeof host !== 'string' || typeof repository !== 'string') {
        throw new Error('Host and repository must be strings');
      }

      try {
        const response = await client.reportsHostRepositoryGet(
          {
            path: {
              host: decodeURIComponent(host),
              repository: decodeURIComponent(repository),
            },
          },
          token,
        );
        const body = await response.json();
        const contents = body.map(value => ({
          uri: `renovate://reports/${encodeURIComponent(value.host)}/${encodeURIComponent(value.repository)}`,
          name: `Renovate report ${value.host}/${value.repository}`,
          description:
            'Contains information of dependencies extracted from the repository, the update status, open PRs, branches and problems found in regard to Renovate',
          mimeType: 'application/json',
          text: JSON.stringify(value),
        }));
        return {
          contents,
        };
      } catch (e) {
        logger.error(
          `Failed to process resource read for ${host}/${repository}`,
          e as Error,
        );
        throw e;
      }
    },
  );

  return server;
}

async function getAuthToken(auth: AuthService): Promise<{ token: string }> {
  return await auth.getPluginRequestToken({
    targetPluginId: 'renovate',
    onBehalfOf: await auth.getOwnServiceCredentials(),
  });
}
