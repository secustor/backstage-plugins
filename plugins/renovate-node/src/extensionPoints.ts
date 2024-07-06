import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { RenovateWrapper } from '@secustor/backstage-plugin-renovate-common';
import { QueueFactory } from './queue/types';
import { RunOptions } from './types';

export interface RenovateRuntimeExtensionPoint {
  addRuntime(id: string, runtime: RenovateWrapper): void;
}

export const renovateRuntimeExtensionPoint =
  createExtensionPoint<RenovateRuntimeExtensionPoint>({
    id: 'renovate.runtimes',
  });

export interface RenovateQueueExtensionPoint<T> {
  addQueueFactory(id: string, factory: QueueFactory<T>): string;
}

export const renovateQueueExtensionPoint = createExtensionPoint<
  RenovateQueueExtensionPoint<RunOptions>
>({
  id: 'renovate.queues',
});
