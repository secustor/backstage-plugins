# renovate

This plugin allows running [Renovate](https://github.com/renovatebot/renovate/) against repositories
and extracts reports from it.

Supported platforms:

- Github
- Gitlab

## Getting started

Install the plugin:

```bash
# Install packages from the root directory
yarn --cwd packages/backend add @secustor/backstage-plugin-renovate-backend
```

Add the plugin to your Backstage instance:

```ts
// Add the following to `packages/backend/src/index.ts`
backend.add(import('@secustor/backstage-plugin-renovate-backend'));
```

Further, you need to add a queue and a runtime implementation.

See the respective plugins for more information:

- [@secustor/backstage-plugin-renovate-backend-module-queue-local](https://www.npmjs.com/package/@secustor/backstage-plugin-renovate-backend-module-queue-local)
- [@secustor/backstage-plugin-renovate-backend-module-queue-redis](https://www.npmjs.com/package/@secustor/backstage-plugin-renovate-backend-module-queue-redis)
- [@secustor/backstage-plugin-renovate-backend-module-runtime-direct](https://www.npmjs.com/package/@secustor/backstage-plugin-renovate-backend-module-runtime-direct)
- [@secustor/backstage-plugin-renovate-backend-module-runtime-docker](https://www.npmjs.com/package/@secustor/backstage-plugin-renovate-backend-module-runtime-docker)
- [@secustor/backstage-plugin-renovate-backend-module-runtime-s3](https://www.npmjs.com/package/@secustor/backstage-plugin-renovate-backend-module-runtime-s3)

If you wish to install the frontend plugin, you can do so by following the instructions in the frontend plugin's [README](../renovate).

## Configuration

The configurations are derived from integrations.

```yaml
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}

backend:
  cache:
    # the plugin will reuse this configuration for Renovates Redis integration
    store: redis
    connection: redis://user:pass@cache.example.com:6379

    cors:
      # expose paginagtion headers to the frontend
      exposedHeaders:
        - x-total-count
        - x-current-page
        - x-page-count
        - x-page-size

renovate:
  cache:
    # Allows turning off cache injection. You can still manually supply caches using the Renovate config
    enabled: false

  cleanup:
    # -1 translates to never delete reports during maintenance tasks
    # x > 0 number of reports to maintain
    minimumReports: -1

    # -1 translates to never delete dependencies during maintenance tasks
    # x > 0 number of dependencies to maintain
    dependencyHistory: -1

  schedules:
    cleanup:
      # enabled: true  # default value
      frequency: { minutes: 60 }
      timeout: { minutes: 60 }
    renovation:
      enabled: false # disable schedule. This is useful e.g. for local development
      frequency: { minutes: 60 }
      timeout: { minutes: 60 }

  runtime:
    # ID of the runtime provided via extension point. This option is required as the backend comes with no runtime by default.
    type: docker

  queue:
    type: local-fastq

  config:
    # only do a lookup and create reports with updates and do not open PRs
    dryRun: lookup
```
