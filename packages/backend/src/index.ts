import 'dotenv/config';

import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();
backend.add(import('@backstage/plugin-app-backend'));

backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));

backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-catalog-backend-module-github'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-backstage-openapi'),
);

backend.add(import('@backstage/plugin-scaffolder-backend'));

backend.add(import('@backstage/plugin-search-backend'));
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

backend.add(import('@backstage/plugin-techdocs-backend'));

backend.add(import('@secustor/backstage-plugin-renovate-backend'));
backend.add(
  import('@secustor/backstage-plugin-renovate-backend-module-runtime-direct'),
);
backend.add(
  import('@secustor/backstage-plugin-renovate-backend-module-runtime-docker'),
);
backend.add(
  import('@secustor/backstage-plugin-renovate-backend-module-runtime-s3'),
);
backend.add(
  import('@secustor/backstage-plugin-renovate-backend-module-queue-local'),
);
backend.add(
  import('@secustor/backstage-plugin-renovate-backend-module-queue-redis'),
);

backend.add(
  import(
    '@secustor/backstage-plugin-scaffolder-backend-module-filter-utilities'
  ),
);
backend.start();
