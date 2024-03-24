import type {
  RenovateRunOptions,
  RenovateWrapper,
} from '@secustor/plugin-renovate-common';
import { ChildProcess, fork } from 'node:child_process';
import findUp from 'find-up';

export class Direct implements RenovateWrapper {
  async run({
    env,
    renovateConfig,
    logger,
  }: RenovateRunOptions): Promise<ChildProcess> {
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
    child.on('error', err => logger.error('Renovate failed', err));
    child.on('exit', code => logger.info(`Renovate exited with code ${code}`));

    return child;
  }
}
