import { createApiRef } from '@backstage/core-plugin-api';
import { DefaultApiClient as RenovateClient } from '@secustor/backstage-plugin-renovate-client';

export const renovateApiRef = createApiRef<RenovateClient>({
  id: 'plugin.renovate.service',
});
