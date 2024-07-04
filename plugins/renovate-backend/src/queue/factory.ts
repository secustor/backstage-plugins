import { Config } from '@backstage/config';
import { RenovateQueue, Runnable } from './types';
import { getCacheConfig } from '../config';
import { RedisQueue } from './redis';
import { LoggerService } from '@backstage/backend-plugin-api';
import { LocalQueue } from './local';

export function createQueue<T extends object>(
  rootConfig: Config,
  logger: LoggerService,
  runnable: Runnable<T>,
): RenovateQueue<T> {
  const cacheURL = getCacheConfig(rootConfig);

  if (!cacheURL) {
    return new LocalQueue(logger, runnable);
  }

  return new RedisQueue(cacheURL, logger, runnable);
}
