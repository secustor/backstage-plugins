import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { RenovateWrapper } from '@secustor/plugin-renovate-common';

export interface RenovateRuntimeExtensionPoint {
  addRuntime(id: string, runtime: RenovateWrapper): void;
}

export const renovateRuntimeExtensionPoint =
  createExtensionPoint<RenovateRuntimeExtensionPoint>({
    id: 'renovate.runtimes',
  });
