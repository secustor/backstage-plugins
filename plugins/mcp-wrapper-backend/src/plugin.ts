import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';

/**
 * mcpWrapperPlugin backend plugin
 *
 * @public
 */
export const mcpWrapperPlugin = createBackendPlugin({
  pluginId: 'mcp-wrapper',
  register(env) {
    env.registerInit({
      deps: {
        auth: coreServices.auth,
        discovery: coreServices.discovery,
        logger: coreServices.logger,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        catalog: catalogServiceRef,
      },
      async init(opts) {
        const { httpRouter } = opts;

        httpRouter.use(await createRouter(opts));

        // TODO remove this as this only for testing
        httpRouter.addAuthPolicy({
          path: '/mcp',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/sse',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/messages',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
