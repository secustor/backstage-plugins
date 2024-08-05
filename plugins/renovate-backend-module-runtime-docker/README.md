# @secustor/backstage-plugin-renovate-backend-module-runtime-docker

The runtime-docker backend module for the renovate plugin.

_This plugin was created through the Backstage CLI_

```yaml
renovate:
  runtime:
    type: docker
    docker:
      pullImage: false

      # all values are option and can be used to overwrite the default values
      image: registry.example.com/renovate/renovate # default: 'ghcr.io/renovatebot/renovate'
      tag: latest # default: 38.18.17
```
