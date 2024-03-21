import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import {createRouter} from "./service/router";

/**
 * DevTools backend plugin
 *
 * @public
 */
export const renovatePlugin = createBackendPlugin({
  pluginId: 'renovate',
  register(env) {
    env.registerInit({
      deps: {
        rootConfig: coreServices.rootConfig,
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        database: coreServices.database
      },
      async init({database,httpRouter, logger, rootConfig}) {
        httpRouter.use(await createRouter({
          logger,
          rootConfig,
          database
        }))
      },
    });
  },
});
