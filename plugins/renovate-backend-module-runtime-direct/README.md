# @secustor/plugin-renovate-backend-module-runtime-direct

This plugin provides a runtime implementation for the Renovate backend plugin.

It is a direct runtime implementation, meaning that Renovate will run directly on the backend node as a forked process.

## Getting started

Install the plugin:

```bash
# Install packages from the root directory
yarn --cwd packages/backend add @secustor/backstage-plugin-renovate-backend-module-runtime-direct
```

Add the plugin to your Backstage instance:

```ts
// Add the following to `packages/backend/src/index.ts`
backend.add(
  import('@secustor/backstage-plugin-renovate-backend-module-runtime-direct'),
);
```

```yaml
renovate:
  runtime:
    type: direct
```
