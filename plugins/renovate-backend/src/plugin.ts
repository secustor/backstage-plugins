import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';
import { RenovateWrapper } from '@secustor/backstage-plugin-renovate-common';
import { RenovateRunner } from './wrapper';
import { RouterOptions } from './service/types';
import { DatabaseHandler } from './service/databaseHandler';
import { renovateRuntimeExtensionPoint } from '@secustor/backstage-plugin-renovate-node';
import { scheduleJobSync } from './service/jobSync';
import { scheduleCleanupTask } from './service/cleanupTask';

/**
 * Renovate backend plugin
 *
 * @public
 */
export const renovatePlugin = createBackendPlugin({
  pluginId: 'renovate',
  register(env) {
    // allow modules provide additional runtimes
    const runtimes = new Map<string, RenovateWrapper>();
    env.registerExtensionPoint(renovateRuntimeExtensionPoint, {
      addRuntime(id: string, runtime: RenovateWrapper) {
        if (runtimes.has(id)) {
          throw new Error(
            ` ${id} has been already registered. Only one wrapper with the same ID is allowed to be registered`,
          );
        }
        runtimes.set(id, runtime);
      },
    });

    env.registerInit({
      deps: {
        rootConfig: coreServices.rootConfig,
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        database: coreServices.database,
        scheduler: coreServices.scheduler,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
      },
      async init(options) {
        const { database, httpRouter, logger } = options;

        const routerOptions: RouterOptions = {
          ...options,
          databaseHandler: await DatabaseHandler.create({ database, logger }),
          runtimes,
        };
        const renovateRunner = await RenovateRunner.from(routerOptions);

        await scheduleJobSync(renovateRunner, routerOptions);
        await scheduleCleanupTask(routerOptions);

        httpRouter.use(await createRouter(renovateRunner, routerOptions));
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
