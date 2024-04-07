import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'renovate',
});

export const rootCatalogRenovateRouteRef = createRouteRef({
  id: 'renovate:catalog-reader-view',
});
