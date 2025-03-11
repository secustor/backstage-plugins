# @secustor/backstage-plugin-scaffolder-backend-module-filter-utilities

This plugin provides a set of utilities to filter modules in the backend scaffolder.

## Getting started

Install the plugin:

```bash
# Install packages from the root directory
yarn --cwd packages/backend add @secustor/backstage-plugin-scaffolder-backend-module-filter-utilities
```

Add the plugin to your Backstage instance:

```ts
// Add the following to `packages/backend/src/index.ts`
backend.add(
  import(
    '@secustor/backstage-plugin-scaffolder-backend-module-filter-utilities'
  ),
);
```

## Content

The plugin provides the following filter utilities:

### `jsonata`

The `jsonata` filter utility allows you to filter modules based on a JSONata expression.
This gives a lot of flexibility to modify and filter data structures in the Scaffolder.

See the [JSONata documentation](https://docs.jsonata.org/overview) for more information and [examples](./src/filters/jsonata/index.ts).
