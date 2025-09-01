import * as dot from 'dotenv';

import { createBackend } from '@backstage/backend-defaults';

dot.config({ quiet: true });

const backend = createBackend();

backend.add(import('@backstage/plugin-app-backend'));

// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);

// See https://backstage.io/docs/features/software-catalog/configuration#subscribing-to-catalog-errors
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));

// permission plugin
backend.add(import('@backstage/plugin-permission-backend'));
// See https://backstage.io/docs/permissions/getting-started for how to create your own permission policy
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);

// search plugin
backend.add(import('@backstage/plugin-search-backend'));

// search engine
// See https://backstage.io/docs/features/search/search-engines
backend.add(import('@backstage/plugin-search-backend-module-pg'));

// search collators
backend.add(import('@backstage/plugin-search-backend-module-catalog'));

// kubernetes plugin
backend.add(import('@backstage/plugin-kubernetes-backend'));

// notifications and signals plugins
backend.add(import('@backstage/plugin-notifications-backend'));
backend.add(import('@backstage/plugin-signals-backend'));

// renovate
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
