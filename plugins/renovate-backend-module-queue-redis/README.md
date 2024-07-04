# @secustor/backstage-plugin-renovate-backend-module-queue-redis

The queue-redis backend module for the renovate plugin.

It provides a queue implementation for the Renovate backend plugin.  
This implementation is geared toward production usage based on `bullmq`, but comes with additional requirements in relation to `local-fastq`.

Benefits:

- Multi-node coordination (jobs are distributed over all instances)
- Job deduplication on add

Additional requirements:

- Needs a configured redis cache for Backstage

```yaml
backend:
  cache:
    store: redis
    connection: redis://localhost:6379

renovate:
  queue:
    type: redis
```
