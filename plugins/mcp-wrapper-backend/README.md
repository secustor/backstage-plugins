# MCP Wrapper Backend Plugin

A Backstage backend plugin that provides a wrapper for the Model Context Protocol (MCP). This plugin enables seamless integration with MCP services by supporting multiple transport options for communication.

## Supported Transport Options

1. **Streamable Http** (Protocol version: 2025-03-26)

   - Endpoint: `/mcp`
   - Methods: GET, POST, DELETE
   - Usage:
     - Initialize with POST to `/mcp`
     - Establish SSE stream with GET to `/mcp`
     - Send requests with POST to `/mcp`
     - Terminate session with DELETE to `/mcp`

2. **Http + SSE** (Protocol version: 2024-11-05)
   - Endpoints: `/sse` (GET) and `/messages` (POST)
   - Usage:
     - Establish SSE stream with GET to `/sse`
     - Send requests with POST to `/messages?sessionId=<id>`

## Installation

This plugin is installed via the `@secustor/backstage-plugin-mcp-wrapper-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @secustor/backstage-plugin-mcp-wrapper-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(import('@secustor/backstage-plugin-mcp-wrapper-backend'));
```

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn start` from the root directory.
