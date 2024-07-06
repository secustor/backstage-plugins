import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  renovateQueueExtensionPoint,
  Runnable,
  RunOptions,
} from '@secustor/backstage-plugin-renovate-node';
import { RedisQueue } from './queue';
import { getCacheConfig } from './config';

export const renovateModuleQueueRedis = createBackendModule({
  pluginId: 'renovate',
  moduleId: 'queue-redis',
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        queueEx: renovateQueueExtensionPoint,
      },
      async init({ logger, queueEx, config }) {
        const cacheURL = getCacheConfig(config);
        if (!cacheURL) {
          logger.warn(
            'Could not find Redis connection URL while Redis Queue module is loaded. Skipping Redis Queue init.',
          );
          return;
        }

        queueEx.addQueueFactory(
          RedisQueue.id,
          (runnable: Runnable<RunOptions>) =>
            new RedisQueue(cacheURL, logger, runnable),
        );
      },
    });
  },
});
