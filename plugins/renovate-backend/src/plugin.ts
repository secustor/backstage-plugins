import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';
import { renovateRuntimeExtensionPoint } from './extensionPoints';
import { RenovateWrapper } from '@secustor/plugin-renovate-common';

/**
 * Renovate backend plugin
 *
 * @public
 */
export const renovatePlugin = createBackendPlugin({
  pluginId: 'renovate',
  register(env) {
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
      },
      async init({ database, httpRouter, logger, rootConfig }) {
        httpRouter.use(
          await createRouter({
            logger,
            rootConfig,
            database,
            runtimes,
          }),
        );
      },
    });
  },
});
