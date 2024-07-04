# @secustor/backstage-plugin-renovate-backend-module-queue-local

The queue-local backend module for the renovate plugin.

It provides a queue implementation for the Renovate backend plugin.  
This implementation is geared toward development setups and small instances.

It lacks:

- multi node coordination
  - All Renovate jobs will run on a random host
- deduplication
  - If a Renovate job is requested multiple the request will not be deduplicated

```yaml
renovate:
  queue:
    type: local-fastq
```
