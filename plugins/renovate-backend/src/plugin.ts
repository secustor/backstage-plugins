import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';
import { RenovateWrapper } from '@secustor/backstage-plugin-renovate-common';
import {
  CatalogClient,
  CATALOG_FILTER_EXISTS,
} from '@backstage/catalog-client';
import { ANNOTATION_SOURCE_LOCATION } from '@backstage/catalog-model';
import { RenovateRunner } from './wrapper';
import { RouterOptions } from './service/types';
import { DatabaseHandler } from './service/databaseHandler';
import { getPluginConfig, getScheduleDefinition } from './config';
import { renovateRuntimeExtensionPoint } from '@secustor/backstage-plugin-renovate-node';

const RENOVATE_ANNOTATION_KEEP_UPDATED = 'renovate.secustor.dev/keep-updated';

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
        const {
          auth,
          database,
          discovery,
          httpRouter,
          rootConfig,
          scheduler,
          logger,
        } = options;

        const routerOptions: RouterOptions = {
          ...options,
          databaseHandler: await DatabaseHandler.create({ database, logger }),
          runtimes,
        };
        const renovateRunner = await RenovateRunner.from(routerOptions);
        const client = new CatalogClient({ discoveryApi: discovery });

        const pluginConfig = getPluginConfig(rootConfig);
        const schedule = getScheduleDefinition(pluginConfig, 'jobSync');

        await scheduler.scheduleTask({
          id: `renovate_job_sync`,
          ...schedule,

          fn: async () => {
            const { token } = await auth.getPluginRequestToken({
              onBehalfOf: await auth.getOwnServiceCredentials(),
              targetPluginId: 'catalog',
            });
            const { items: entities } = await client.getEntities(
              {
                filter: {
                  [`metadata.annotations.${RENOVATE_ANNOTATION_KEEP_UPDATED}`]:
                    CATALOG_FILTER_EXISTS,
                  [`metadata.annotations.${ANNOTATION_SOURCE_LOCATION}`]:
                    CATALOG_FILTER_EXISTS,
                },
                fields: [
                  'kind',
                  'metadata.annotations',
                  'metadata.name',
                  'metadata.namespace',
                  'metadata.title',
                ],
              },
              { token },
            );

            for (const entity of entities) {
              renovateRunner.schedule(entity);
            }
          },
        });

        httpRouter.use(await createRouter(renovateRunner, routerOptions));
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
