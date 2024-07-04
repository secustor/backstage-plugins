import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  renovateQueueExtensionPoint,
  Runnable,
  RunOptions,
} from '@secustor/backstage-plugin-renovate-node';
import { LocalQueue } from './queue';

export const renovateModuleQueueLocal = createBackendModule({
  pluginId: 'renovate',
  moduleId: 'queue-local',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        queueEx: renovateQueueExtensionPoint,
      },
      async init({ logger, queueEx }) {
        queueEx.addQueueFactory(
          LocalQueue.id,
          (runnable: Runnable<RunOptions>) => new LocalQueue(logger, runnable),
        );
      },
    });
  },
});
