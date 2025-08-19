import { Config } from '@backstage/config';

export function getCacheConfig(config: Config): string | null {
  // Override the cache connection settings when the backstage backend is not using Redis as cache store but Redis queue is still desired
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
