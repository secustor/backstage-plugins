import {
  RenovateRunOptions, RenovateRunResult,
  RenovateWrapper,
} from '@secustor/plugin-renovate-common';
import { fork } from 'node:child_process';
import findUp from 'find-up';

export class Direct implements RenovateWrapper {
  async run({
    env,
    renovateConfig,
  }: RenovateRunOptions): Promise<RenovateRunResult> {
    // find Renovate bin
    const binaryPath = findUp.sync(directory => {
      const renovatePath = `${directory}/node_modules/.bin/renovate`;
      const exists = findUp.sync.exists(renovatePath);
      return exists ? renovatePath : undefined;
    });
    if (!binaryPath) {
      throw new Error('Could not find Renovate bin in node_modules folder');
    }

    env.RENOVATE_CONFIG = JSON.stringify(renovateConfig);

    const child = fork(binaryPath, { env, silent: true });
    return {stdout: child.stdout!};
  }
}
