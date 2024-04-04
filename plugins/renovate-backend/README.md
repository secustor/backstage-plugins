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
  schedules:
  jobSync:
    frequency: { minutes: 60 }
    timeout: { minutes: 60 }
  renovation:
    frequency: { minutes: 60 }
    timeout: { minutes: 60 }

  runtime:
    # ID of the runtime provided via extension point. This option is required as the backend comes with no runtime by default.
    type: docker

  config:
    # unset this value if you want to opt out of the cache injection
    redisUrl:
```
