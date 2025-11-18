# @secustor/backstage-plugin-renovate-backend-module-runtime-docker

This plugin provides a runtime implementation for the Renovate backend plugin.

It is a docker runtime implementation, meaning that Renovate will run in a docker container as a sidecar.
Therefore, Backstage will need to have access to a docker daemon.

## Getting started

Install the plugin:

```bash
# Install packages from the root directory
yarn --cwd packages/backend add @secustor/backstage-plugin-renovate-backend-module-runtime-docker
```

Add the plugin to your Backstage instance:

```ts
// Add the following to `packages/backend/src/index.ts`
backend.add(
  import('@secustor/backstage-plugin-renovate-backend-module-runtime-docker'),
);
```

```yaml
renovate:
  runtime:
    type: docker
    docker:
      pullImage: false

      # all values are option and can be used to overwrite the default values
      image: registry.example.com/renovate/renovate # default: 'ghcr.io/renovatebot/renovate'
      tag: latest # default: 42.14.2
```
