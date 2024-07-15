# @secustor/backstage-plugin-renovate

## 0.9.0

### Minor Changes

- [#265](https://github.com/secustor/backstage-plugins/pull/265) [`c62394f`](https://github.com/secustor/backstage-plugins/commit/c62394f0febb1f6db5e9486b8172d1e5ddcf77a6) Thanks [@secustor](https://github.com/secustor)! - Add notification for RenovateStartButton run

### Patch Changes

- [#263](https://github.com/secustor/backstage-plugins/pull/263) [`003673f`](https://github.com/secustor/backstage-plugins/commit/003673fd703c6cfd156de793283992d94d5ffdac) Thanks [@secustor](https://github.com/secustor)! - Handle empty results from renvate client

- Updated dependencies [[`003673f`](https://github.com/secustor/backstage-plugins/commit/003673fd703c6cfd156de793283992d94d5ffdac)]:
  - @secustor/backstage-plugin-renovate-client@0.6.4

## 0.8.1

### Patch Changes

- [#253](https://github.com/secustor/backstage-plugins/pull/253) [`8180942`](https://github.com/secustor/backstage-plugins/commit/818094266364607fb69e4592d65629fbdb614934) Thanks [@secustor](https://github.com/secustor)! - Fix cases for Docker dependencies which have no depName but rather only registryUrls

- [#251](https://github.com/secustor/backstage-plugins/pull/251) [`9ced2fd`](https://github.com/secustor/backstage-plugins/commit/9ced2fd120ee17394c5279511b2fa4b3750f8b41) Thanks [@secustor](https://github.com/secustor)! - Add Empty state to RenovateEntityContent with rescan functionality

- Updated dependencies [[`8180942`](https://github.com/secustor/backstage-plugins/commit/818094266364607fb69e4592d65629fbdb614934)]:
  - @secustor/backstage-plugin-renovate-common@0.5.3
  - @secustor/backstage-plugin-renovate-client@0.6.3

## 0.8.0

### Minor Changes

- [#248](https://github.com/secustor/backstage-plugins/pull/248) [`39a7b47`](https://github.com/secustor/backstage-plugins/commit/39a7b47f40760653f36f7b540a3f491ba124725b) Thanks [@secustor](https://github.com/secustor)! - Sort ReportFetchComponent table by timesstamp on load

### Patch Changes

- [#248](https://github.com/secustor/backstage-plugins/pull/248) [`b778def`](https://github.com/secustor/backstage-plugins/commit/b778defe18b69059fd7962f508eb5f930f212bbd) Thanks [@secustor](https://github.com/secustor)! - Make currentValue optional in schema

- Updated dependencies [[`b778def`](https://github.com/secustor/backstage-plugins/commit/b778defe18b69059fd7962f508eb5f930f212bbd)]:
  - @secustor/backstage-plugin-renovate-common@0.5.2
  - @secustor/backstage-plugin-renovate-client@0.6.2

## 0.7.1

### Patch Changes

- [#240](https://github.com/secustor/backstage-plugins/pull/240) [`0a1987e`](https://github.com/secustor/backstage-plugins/commit/0a1987ed57ffff04a3031e4d4182f29346aa23ba) Thanks [@secustor](https://github.com/secustor)! - Improve version comparison logic, report schema and refactor

- Updated dependencies [[`0a1987e`](https://github.com/secustor/backstage-plugins/commit/0a1987ed57ffff04a3031e4d4182f29346aa23ba)]:
  - @secustor/backstage-plugin-renovate-common@0.5.1
  - @secustor/backstage-plugin-renovate-client@0.6.1

## 0.7.0

### Minor Changes

- [#228](https://github.com/secustor/backstage-plugins/pull/228) [`e7c8fa8`](https://github.com/secustor/backstage-plugins/commit/e7c8fa82a54afe61666eaa8796f3700fbbf7a3bf) Thanks [@secustor](https://github.com/secustor)! - Add inspect report button to Renovate page

### Patch Changes

- [#234](https://github.com/secustor/backstage-plugins/pull/234) [`5bcb902`](https://github.com/secustor/backstage-plugins/commit/5bcb9024a5ceba830496ae6ce8c3570408e3a205) Thanks [@secustor](https://github.com/secustor)! - Do not crash EntityRenovateContent if entity does not contain a non url source-url annoation

- [#237](https://github.com/secustor/backstage-plugins/pull/237) [`055834b`](https://github.com/secustor/backstage-plugins/commit/055834bed6cc6f0532154e78aa9a98883d01ff62) Thanks [@secustor](https://github.com/secustor)! - Move Actions column to the right

- [#234](https://github.com/secustor/backstage-plugins/pull/234) [`5bcb902`](https://github.com/secustor/backstage-plugins/commit/5bcb9024a5ceba830496ae6ce8c3570408e3a205) Thanks [@secustor](https://github.com/secustor)! - Fix crash on RenovateFetchComponent row click

- Updated dependencies [[`2dca129`](https://github.com/secustor/backstage-plugins/commit/2dca129a5d53a2b2afa8ea445e37a63feaabf139), [`de9e112`](https://github.com/secustor/backstage-plugins/commit/de9e1125ba87d7d43efb632f5643a52c87dbe0ac), [`d7e1b7c`](https://github.com/secustor/backstage-plugins/commit/d7e1b7ca9a9903ef8b8616f7e018a4a93647a621), [`5127503`](https://github.com/secustor/backstage-plugins/commit/51275030592f999140fce2fea25f54d0fd2ae8f8)]:
  - @secustor/backstage-plugin-renovate-client@0.6.0
  - @secustor/backstage-plugin-renovate-common@0.5.0

## 0.6.0

### Minor Changes

- [#206](https://github.com/secustor/backstage-plugins/pull/206) [`7437c6d`](https://github.com/secustor/backstage-plugins/commit/7437c6d19f5ff073bdc970f2542902ee4a1bab73) Thanks [@secustor](https://github.com/secustor)! - Add cleanup job to delete outdated reports

- [`ee838a1`](https://github.com/secustor/backstage-plugins/commit/ee838a1c665a5fff27b1fe68758fb805125d9b95) Thanks [@secustor](https://github.com/secustor)! - Upgrade Backstage to 1.28.0

### Patch Changes

- [#206](https://github.com/secustor/backstage-plugins/pull/206) [`7437c6d`](https://github.com/secustor/backstage-plugins/commit/7437c6d19f5ff073bdc970f2542902ee4a1bab73) Thanks [@secustor](https://github.com/secustor)! - Correctly handle non minor or major upgrades

- Updated dependencies [[`7437c6d`](https://github.com/secustor/backstage-plugins/commit/7437c6d19f5ff073bdc970f2542902ee4a1bab73), [`ee838a1`](https://github.com/secustor/backstage-plugins/commit/ee838a1c665a5fff27b1fe68758fb805125d9b95)]:
  - @secustor/backstage-plugin-renovate-client@0.5.0
  - @secustor/backstage-plugin-renovate-common@0.4.0

## 0.5.1

### Patch Changes

- [#140](https://github.com/secustor/backstage-plugins/pull/140) [`b3f6c2b`](https://github.com/secustor/backstage-plugins/commit/b3f6c2bff76b15371b100a5d3d71b46dd59275b1) Thanks [@secustor](https://github.com/secustor)! - Upgrade Backstage 1.26.3

- Updated dependencies [[`b3f6c2b`](https://github.com/secustor/backstage-plugins/commit/b3f6c2bff76b15371b100a5d3d71b46dd59275b1)]:
  - @secustor/backstage-plugin-renovate-client@0.4.1
  - @secustor/backstage-plugin-renovate-common@0.3.1

## 0.5.0

### Minor Changes

- 1f997fb: Allow to save multiple reports for the same repository
- 9cca08e: Add links to packageFiles in EntityRenovateContent

### Patch Changes

- Updated dependencies [1f997fb]
  - @secustor/backstage-plugin-renovate-client@0.4.0
  - @secustor/backstage-plugin-renovate-common@0.3.0

## 0.4.0

### Minor Changes

- 54e3842: Add Entity Content page to show extracted dependencies

### Patch Changes

- Updated dependencies [04a943e]
- Updated dependencies [a22994b]
  - @secustor/backstage-plugin-renovate-common@0.2.0
  - @secustor/backstage-plugin-renovate-client@0.3.0

## 0.3.0

### Minor Changes

- ed59d8d: Add number of found dependencies column

### Patch Changes

- Updated dependencies [5a12bc4]
- Updated dependencies [c9c5ab2]
  - @secustor/backstage-plugin-renovate-common@0.1.2
  - @secustor/backstage-plugin-renovate-client@0.2.0

## 0.2.0

### Minor Changes

- 63418f2: Improve RenovateStarter and add loading feedback

## 0.1.1

### Patch Changes

- 45edddc: Fix release process
- Updated dependencies [45edddc]
  - @secustor/backstage-plugin-renovate-client@0.1.1
  - @secustor/backstage-plugin-renovate-common@0.1.1
