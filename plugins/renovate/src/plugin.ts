import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const renovatePlugin = createPlugin({
  id: 'renovate',
  routes: {
    root: rootRouteRef,
  },
});

export const RenovatePage = renovatePlugin.provide(
  createRoutableExtension({
    name: 'RenovatePage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
