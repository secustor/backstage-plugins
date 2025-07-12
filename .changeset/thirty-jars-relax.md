---
'@secustor/backstage-plugin-renovate-backend': minor
---

Implemented ability to pass host environment variables to the renovate runner. These can be auto passed or overwritten using renovate.runtime.environment array with name/value keys. This is to resolve an issue with directs inability to use fork node process of custom CAs.
