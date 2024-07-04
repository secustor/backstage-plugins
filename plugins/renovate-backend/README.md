# renovate

This plugin allows running [Renovate](https://github.com/renovatebot/renovate/) against repositories
and extract reports from it.

Supported platforms:

- Github
- Gitlab

## Getting started

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

renovate:
  cache:
    # Allows turning off cache injection. You can still manually supply caches using the Renovate config
    enabled: false

  cleanup:
    # -1 translates to never delete reports during maintenance tasks
    # x > 0 number of reports to maintain
    minimumReports: -1
  schedules:
    cleanup:
      frequency: { minutes: 60 }
      timeout: { minutes: 60 }
    renovation:
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
