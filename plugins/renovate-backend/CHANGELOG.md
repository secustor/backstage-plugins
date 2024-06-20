# @secustor/backstage-plugin-renovate-backend

## 0.8.0

### Minor Changes

- [#206](https://github.com/secustor/backstage-plugins/pull/206) [`7437c6d`](https://github.com/secustor/backstage-plugins/commit/7437c6d19f5ff073bdc970f2542902ee4a1bab73) Thanks [@secustor](https://github.com/secustor)! - Add cleanup job to delete outdated reports

- [`ee838a1`](https://github.com/secustor/backstage-plugins/commit/ee838a1c665a5fff27b1fe68758fb805125d9b95) Thanks [@secustor](https://github.com/secustor)! - Upgrade Backstage to 1.28.0

### Patch Changes

- Updated dependencies [[`ee838a1`](https://github.com/secustor/backstage-plugins/commit/ee838a1c665a5fff27b1fe68758fb805125d9b95)]:
  - @secustor/backstage-plugin-renovate-common@0.4.0
  - @secustor/backstage-plugin-renovate-node@0.2.0

## 0.7.1

### Patch Changes

- [#140](https://github.com/secustor/backstage-plugins/pull/140) [`b3f6c2b`](https://github.com/secustor/backstage-plugins/commit/b3f6c2bff76b15371b100a5d3d71b46dd59275b1) Thanks [@secustor](https://github.com/secustor)! - Upgrade Backstage 1.26.3

- Updated dependencies [[`b3f6c2b`](https://github.com/secustor/backstage-plugins/commit/b3f6c2bff76b15371b100a5d3d71b46dd59275b1)]:
  - @secustor/backstage-plugin-renovate-common@0.3.1
  - @secustor/backstage-plugin-renovate-node@0.1.4

## 0.7.0

### Minor Changes

- [#136](https://github.com/secustor/backstage-plugins/pull/136) [`0d00e10`](https://github.com/secustor/backstage-plugins/commit/0d00e10ab7cb666859d361bc6f37216b35fb89e9) Thanks [@secustor](https://github.com/secustor)! - Support usage of Github Apps for authentification

## 0.6.0

### Minor Changes

- fd4d780: Replace null setting of redisURL with an explicit setting for disabling cache injection

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
