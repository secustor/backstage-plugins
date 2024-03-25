import {
  RenovateRunOptions,
  RenovateRunResult,
  RenovateWrapper,
} from '@secustor/plugin-renovate-common';
import { DockerContainerRunner } from '@backstage/backend-common';
import Docker from 'dockerode';
import { PassThrough } from 'stream';

export class DockerRuntime implements RenovateWrapper {
  #runner: DockerContainerRunner;

  constructor() {
    this.#runner = new DockerContainerRunner({ dockerClient: new Docker() });
  }

  async run({
    env,
    renovateConfig,
    runtimeConfig,
  }: RenovateRunOptions): Promise<RenovateRunResult> {
    env.RENOVATE_CONFIG = JSON.stringify(renovateConfig);

    const image =
      runtimeConfig.getOptionalString('image') ??
      'ghcr.io/renovatebot/renovate';
    const tag = runtimeConfig.getOptionalString('tag') ?? '37.269.5'; // TODO add autoupdates

    const stdout = new PassThrough();
    this.#runner.runContainer({
      args: [],
      envVars: env,
      imageName: `${image}:${tag}`,
      logStream: stdout,
    });

    return { stdout };
  }
}
