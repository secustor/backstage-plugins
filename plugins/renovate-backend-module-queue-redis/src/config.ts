import { Config } from '@backstage/config';

export function getCacheConfig(config: Config): string | null {
  // Override the cache connection settings.
  // Used in instances where backstage backend is not using redis as cache store.
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
