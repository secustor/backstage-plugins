import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { rootRouteRef } from './routes';
import { renovateApiRef } from './api';
import { DefaultApiClient } from '@secustor/plugin-renovate-client';

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
        new DefaultApiClient({ discoveryApi, fetchApi }),
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
