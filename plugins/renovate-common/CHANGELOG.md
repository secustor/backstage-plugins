# @secustor/backstage-plugin-renovate-common

## 0.6.1

### Patch Changes

- [#347](https://github.com/secustor/backstage-plugins/pull/347) [`bc22208`](https://github.com/secustor/backstage-plugins/commit/bc2220832518951e71969b1d2a81ba9e7e63552f) Thanks [@secustor](https://github.com/secustor)! - Make skip entries which contain no packageName and not a depName

## 0.6.0

### Minor Changes

- [#343](https://github.com/secustor/backstage-plugins/pull/343) [`c755655`](https://github.com/secustor/backstage-plugins/commit/c7556558e815f0c4fcf9671b8f919bee51b51e5a) Thanks [@secustor](https://github.com/secustor)! - Add global dependency overview, dependency api endpoint and dependency database

### Patch Changes

- [#343](https://github.com/secustor/backstage-plugins/pull/343) [`c755655`](https://github.com/secustor/backstage-plugins/commit/c7556558e815f0c4fcf9671b8f919bee51b51e5a) Thanks [@secustor](https://github.com/secustor)! - Hide RenovateStarter by default allow to enable via props

## 0.5.5

### Patch Changes

- [#324](https://github.com/secustor/backstage-plugins/pull/324) [`48ca691`](https://github.com/secustor/backstage-plugins/commit/48ca691ab1b66c7622d1b5ff67ea73922f9cf563) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update dependency git-url-parse to v15

- [#333](https://github.com/secustor/backstage-plugins/pull/333) [`28e1ff6`](https://github.com/secustor/backstage-plugins/commit/28e1ff60fa1630f9be80add8951566bc2a2ca4f8) Thanks [@secustor](https://github.com/secustor)! - Upgrade Backstage to 1.30.4

## 0.5.4

### Patch Changes

- [#279](https://github.com/secustor/backstage-plugins/pull/279) [`e9cee4f`](https://github.com/secustor/backstage-plugins/commit/e9cee4f6af7e472bc864ec374b8df0e48ca68a5f) Thanks [@secustor](https://github.com/secustor)! - Update to release Backstage 1.29.1

## 0.5.3

### Patch Changes

- [#253](https://github.com/secustor/backstage-plugins/pull/253) [`8180942`](https://github.com/secustor/backstage-plugins/commit/818094266364607fb69e4592d65629fbdb614934) Thanks [@secustor](https://github.com/secustor)! - Fix cases for Docker dependencies which have no depName but rather only registryUrls

## 0.5.2

### Patch Changes

- [#248](https://github.com/secustor/backstage-plugins/pull/248) [`b778def`](https://github.com/secustor/backstage-plugins/commit/b778defe18b69059fd7962f508eb5f930f212bbd) Thanks [@secustor](https://github.com/secustor)! - Make currentValue optional in schema

## 0.5.1

### Patch Changes

- [#240](https://github.com/secustor/backstage-plugins/pull/240) [`0a1987e`](https://github.com/secustor/backstage-plugins/commit/0a1987ed57ffff04a3031e4d4182f29346aa23ba) Thanks [@secustor](https://github.com/secustor)! - Improve version comparison logic, report schema and refactor

## 0.5.0

### Minor Changes

- [#237](https://github.com/secustor/backstage-plugins/pull/237) [`2dca129`](https://github.com/secustor/backstage-plugins/commit/2dca129a5d53a2b2afa8ea445e37a63feaabf139) Thanks [@secustor](https://github.com/secustor)! - Support supplying URLs with missing protocol to RenovateStarter

- [#233](https://github.com/secustor/backstage-plugins/pull/233) [`de9e112`](https://github.com/secustor/backstage-plugins/commit/de9e1125ba87d7d43efb632f5643a52c87dbe0ac) Thanks [@secustor](https://github.com/secustor)! - BREAKING CHANGE! Renovate runs are now controlled by queues supplied via separate packages. Similar to `runtime` the backend comes without a default implementation.

### Patch Changes

- [#235](https://github.com/secustor/backstage-plugins/pull/235) [`d7e1b7c`](https://github.com/secustor/backstage-plugins/commit/d7e1b7ca9a9903ef8b8616f7e018a4a93647a621) Thanks [@secustor](https://github.com/secustor)! - Remove deprecated imports and remove usage of @backstage/backend-common

- [#237](https://github.com/secustor/backstage-plugins/pull/237) [`5127503`](https://github.com/secustor/backstage-plugins/commit/51275030592f999140fce2fea25f54d0fd2ae8f8) Thanks [@secustor](https://github.com/secustor)! - Allow RenovateStarter to supply host for multi host setups

## 0.4.0

### Minor Changes

- [`ee838a1`](https://github.com/secustor/backstage-plugins/commit/ee838a1c665a5fff27b1fe68758fb805125d9b95) Thanks [@secustor](https://github.com/secustor)! - Upgrade Backstage to 1.28.0

## 0.3.1

### Patch Changes

- [#140](https://github.com/secustor/backstage-plugins/pull/140) [`b3f6c2b`](https://github.com/secustor/backstage-plugins/commit/b3f6c2bff76b15371b100a5d3d71b46dd59275b1) Thanks [@secustor](https://github.com/secustor)! - Upgrade Backstage 1.26.3

## 0.3.0

### Minor Changes

- 1f997fb: Allow to save multiple reports for the same repository

## 0.2.0

### Minor Changes

- a22994b: /runs Post now expects a stringified version of the entity rather then the full object

### Patch Changes

- 04a943e: Support source urls for getTargetRepo with url: prefix

## 0.1.2

### Patch Changes

- 5a12bc4: Use underscores instead for slashes for task ids

## 0.1.1

### Patch Changes

- 45edddc: Fix release process
