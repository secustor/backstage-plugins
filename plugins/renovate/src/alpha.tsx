import { discoveryApiRef, fetchApiRef } from '@backstage/frontend-plugin-api';
import {
  ApiBlueprint,
  createFrontendPlugin,
  NavItemBlueprint,
  createRouteRef,
} from '@backstage/frontend-plugin-api';
import { renovateApiRef } from './api';
import { RenovateClient } from '@secustor/backstage-plugin-renovate-client';
import { PageBlueprint } from '@backstage/frontend-plugin-api';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';

const rootRouteRef = createRouteRef();

export const renovateNavItem = NavItemBlueprint.make({
  params: {
    title: 'Renovate',
    icon: FormatPaintIcon,
    routeRef: rootRouteRef,
  },
});

export const renovatePage = PageBlueprint.make({
  params: {
    path: '/renovate',
    routeRef: rootRouteRef,
    loader: () =>
      import('./components/RenovateDefaultOverview').then(m =>
        <m.RenovateDefaultOverview />,
      ),
  },
});

export const EntityRenovateContent = EntityContentBlueprint.make({
  params: {
    path: '/renovate',
    title: 'Renovate',
    loader: () =>
      import('./components/EntityRenovateContent').then(m =>
        <m.EntityRenovateContent />,
      ),
  },
});

const renovateApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams({
      api: renovateApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new RenovateClient({ discoveryApi, fetchApi }),
    }),
});

export default createFrontendPlugin({
  pluginId: 'renovate',
  extensions: [
    renovatePage,
    renovateApi,
    EntityRenovateContent,
    renovateNavItem,
  ],
});
