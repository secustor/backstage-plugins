import {
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import {
  ApiBlueprint,
  createFrontendPlugin,
} from '@backstage/frontend-plugin-api';
import { convertLegacyRouteRefs } from '@backstage/core-compat-api';
import { rootRouteRef } from './routes';
import { renovateApiRef } from './api';
import { RenovateClient } from '@secustor/backstage-plugin-renovate-client';
import { PageBlueprint } from '@backstage/frontend-plugin-api';
import {
  compatWrapper,
  convertLegacyRouteRef,
} from '@backstage/core-compat-api';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';

export const RenovatePage = PageBlueprint.make({
  params: {
    defaultPath: '/renovate',
    // TODO remove converter when fully migrated to the new system
    routeRef: convertLegacyRouteRef(rootRouteRef),
    loader: () =>
      import('./components/RenovateDefaultOverview').then(m =>
        compatWrapper(<m.RenovateDefaultOverview />),
      ),
  },
});

export const EntityRenovateContent = EntityContentBlueprint.make({
  params: {
    defaultPath: '/renovate',
    defaultTitle: 'Renovate',
    loader: () =>
      import('./components/EntityRenovateContent').then(m =>
        compatWrapper(<m.EntityRenovateContent />),
      ),
  },
});

const renovateApiFactory = ApiBlueprint.make({
  params: {
    factory: createApiFactory({
      api: renovateApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new RenovateClient({ discoveryApi, fetchApi }),
    }),
  },
});

export default createFrontendPlugin({
  id: 'renovate',
  extensions: [RenovatePage, renovateApiFactory, EntityRenovateContent],
  routes: convertLegacyRouteRefs({
    root: rootRouteRef,
  }),
});
