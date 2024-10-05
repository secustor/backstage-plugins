# @secustor/backstage-plugin-renovate-backend-module-queue-redis

The queue-redis backend module for the renovate plugin.

It provides a queue implementation for the Renovate backend plugin.  
This implementation is geared toward production usage based on `bullmq`, but comes with additional requirements in relation to `local-fastq`.

Benefits:

- Multi-node coordination (jobs are distributed over all instances)
- Job deduplication on add

Additional requirements:

- Needs a configured redis cache for Backstage

## Getting started

Install the plugin:

```bash
# Install packages from the root directory
yarn --cwd packages/backend add @secustor/backstage-plugin-renovate-backend-module-queue-redis
```

Add the plugin to your Backstage instance:

```ts
// Add the following to `packages/backend/src/index.ts`
backend.add(
  import('@secustor/backstage-plugin-renovate-backend-module-queue-redis'),
);
```

```yaml
backend:
  cache:
    store: redis
    connection: redis://localhost:6379

renovate:
  queue:
    type: redis
```
