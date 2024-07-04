import { Config } from '@backstage/config';
import { getPluginConfig } from '../config';
import {
  QueueFactory,
  RenovateQueue,
  Runnable,
} from '@secustor/backstage-plugin-renovate-node';

export function createQueue<T extends object>(
  queues: Map<string, QueueFactory<T>>,
  rootConfig: Config,
  runnable: Runnable<T>,
): RenovateQueue<T> {
  const type = getPluginConfig(rootConfig).getString('queue.type');

  const factory = queues.get(type);
  if (!factory) {
    throw new Error(`Could not find Queue implementation ${type}`);
  }

  return factory(runnable);
}
