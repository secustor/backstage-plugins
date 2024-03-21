import type { RenovateRunOptions, RenovateWrapper } from '../types';
import fs from 'fs/promises';
import { ChildProcess, execFile, exec, fork } from 'node:child_process';
import os from 'os';
import findUp from 'find-up';

const configLocation = `${os.tmpdir()}/renovate-config.json`;

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

    await fs.writeFile(
      configLocation,
      JSON.stringify(renovateConfig, null, '  '),
    );
    env.RENOVATE_CONFIG_FILE = configLocation;

    const test = fork(binaryPath, { env, silent: true });
    test.on('error', err => logger.error('Renovate failed', err));
    test.on('exit', code => logger.info(`Renovate exited with code ${code}`));

    return test;
  }
}
