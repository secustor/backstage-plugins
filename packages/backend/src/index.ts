import 'dotenv/config';

import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();
backend.add(import('@backstage/plugin-app-backend/alpha'));

backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));

backend.add(import('@backstage/plugin-catalog-backend/alpha'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-catalog-backend-module-github/alpha'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-backstage-openapi'),
);

backend.add(import('@backstage/plugin-scaffolder-backend/alpha'));

backend.add(import('@backstage/plugin-search-backend/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-catalog/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs/alpha'));

backend.add(import('@backstage/plugin-techdocs-backend/alpha'));

backend.add(import('@secustor/backstage-plugin-renovate-backend'));
backend.add(
  import('@secustor/backstage-plugin-renovate-backend-module-runtime-direct'),
);
backend.add(
  import('@secustor/backstage-plugin-renovate-backend-module-runtime-docker'),
);
backend.add(
  import('@secustor/backstage-plugin-renovate-backend-module-queue-local'),
);
backend.add(
  import('@secustor/backstage-plugin-renovate-backend-module-queue-redis'),
);

backend.start();
