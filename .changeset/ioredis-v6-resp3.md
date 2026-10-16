---
'@secustor/backstage-plugin-renovate-backend-module-queue-redis': minor
---

**BREAKING**: Upgrade `ioredis` to v6.

`ioredis` now connects using the RESP3 protocol by default, which requires Redis 6 or newer.
Redis servers or Redis-compatible services without RESP3 support (e.g. Redis 5 and older) will fail to connect.
Upgrade your Redis instance before updating this module.

Additionally, the default reconnect strategy now uses exponential backoff (capped at 5s) instead of linear backoff (capped at 2s), and TCP keep-alive is enabled with a 30s initial delay.
