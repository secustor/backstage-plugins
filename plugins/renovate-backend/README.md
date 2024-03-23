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

renovate:
  # ID of the runtime provided via extension point. This option is required as the backend comes with no runtime by default.
  runtime: direct
  # defines a list of allowed hosts to which the report is sent to if a callBackURL is provided with the run request.
  # If the list is not set, localhost is allowed.
  # In case you want to forbid all callbacks, set it to an empty array '[]'
  callBacks:
    allowedHosts:
      - my.endpoint.local
  config:
    # all global (bot) configuration options are available here,
    # but be careful if self-hosted options are used as they can interfere with the operations
    # https://docs.renovatebot.com/self-hosted-configuration/#redisurl
    redisUrl: redis://[[username]:[password]]@localhost:6379/0
    redisPrefix: renovate
```
