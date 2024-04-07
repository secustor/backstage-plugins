import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { rootCatalogRenovateRouteRef, rootRouteRef } from './routes';
import { renovateApiRef } from './api';
import { RenovateClient } from '@secustor/backstage-plugin-renovate-client';

export const renovatePlugin = createPlugin({
  id: 'renovate',
  apis: [
    createApiFactory({
      api: renovateApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new RenovateClient({ discoveryApi, fetchApi }),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

export const RenovatePage = renovatePlugin.provide(
  createRoutableExtension({
    name: 'RenovatePage',
    component: () =>
      import('./components/RenovateDefaultOverview').then(
        m => m.RenovateDefaultOverview,
      ),
    mountPoint: rootRouteRef,
  }),
);

export const EntityRenovateContent = renovatePlugin.provide(
  createRoutableExtension({
    name: 'EntityRenovateContent',
    component: () =>
      import('./components/EntityRenovateContent').then(
        m => m.EntityRenovateContent,
      ),
    mountPoint: rootCatalogRenovateRouteRef,
  }),
);
