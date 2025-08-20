import { Config } from '@backstage/config';

export function getCacheConfig(config: Config): string | null {
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

export function getOverrideConnection(config: Config): string | null {
  return config.getOptionalString('renovate.queue.redis.connection') ?? null;
}
