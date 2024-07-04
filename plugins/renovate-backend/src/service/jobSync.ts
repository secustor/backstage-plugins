import {
  CATALOG_FILTER_EXISTS,
  CatalogClient,
} from '@backstage/catalog-client';
import { ANNOTATION_SOURCE_LOCATION } from '@backstage/catalog-model';
import { RouterOptions } from './types';
import {
  getPluginConfig,
  getScheduleDefinition,
  RENOVATE_ANNOTATION_KEEP_UPDATED,
} from '../config';
import { RenovateRunner } from '../wrapper';

export async function scheduleJobSync(
  renovateRunner: RenovateRunner,
  routerOptions: RouterOptions,
): Promise<void> {
  const { scheduler, auth, rootConfig, discovery } = routerOptions;

  const client = new CatalogClient({ discoveryApi: discovery });

  const pluginConfig = getPluginConfig(rootConfig);
  const schedule = getScheduleDefinition(pluginConfig, 'renovation');

  return scheduler.scheduleTask({
    id: `renovate_scheduled_runs`,
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

      await renovateRunner.addToQueue(...entities);
    },
  });
}
