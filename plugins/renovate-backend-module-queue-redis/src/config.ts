import { Config } from '@backstage/config';

export function getCacheConfig(config: Config): string | null {
const overrideCacheConnection = config.getOptionalString('renovate.queue.redis.connection')
  const overrideCacheConfig = config.getOptionalConfig('renovate.queue.redis');
  if (overrideCacheConfig) {
    const overrideCacheConnection =
      overrideCacheConfig.getOptionalString('connection');
    if (overrideCacheConnection) {
      return overrideCacheConnection;
    }
  }

  const cacheConfig = config.getOptionalConfig('backend.cache');
  if (!cacheConfig) {
    return null;
  }

  const store = cacheConfig.getString('store');
  if (store !== 'redis') {
    return null;
  }

  return cacheConfig.getOptionalString('connection') ?? null;
}
