# @secustor/backstage-plugin-renovate-backend

## 0.5.0

### Minor Changes

- 1f997fb: Allow to save multiple reports for the same repository

### Patch Changes

- Updated dependencies [1f997fb]
  - @secustor/backstage-plugin-renovate-common@0.3.0
  - @secustor/backstage-plugin-renovate-node@0.1.3

## 0.4.0

### Minor Changes

- a22994b: /runs Post now expects a stringified version of the entity rather then the full object

### Patch Changes

- Updated dependencies [04a943e]
- Updated dependencies [a22994b]
  - @secustor/backstage-plugin-renovate-common@0.2.0
  - @secustor/backstage-plugin-renovate-node@0.1.2

## 0.3.0

### Minor Changes

- c9c5ab2: Remove call back feature as will no longer possible if the Backstage task runner system is used
- b196ddc: Allow opting out of Redis cache injection

### Patch Changes

- 5a12bc4: Use underscores instead for slashes for task ids
- b6541b4: Fix database column for last_updated to timestamp rather time
- ed52293: Fix task scheduling in case there is no runner yet scheduled
- Updated dependencies [5a12bc4]
  - @secustor/backstage-plugin-renovate-common@0.1.2
  - @secustor/backstage-plugin-renovate-node@0.1.1

## 0.2.0

### Minor Changes

- 3442c0d: Extract Redis cache from configuration and supply to Renovate

### Patch Changes

- 80d6c33: Use scheduleTask to fix initial rerun
- 1610dec: Move extension points to separate node library package

## 0.1.2

### Patch Changes

- 98796af: Publish migrations

## 0.1.1

### Patch Changes

- 45edddc: Fix release process
- Updated dependencies [45edddc]
  - @secustor/backstage-plugin-renovate-common@0.1.1
