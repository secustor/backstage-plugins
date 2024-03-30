import {
  RenovateRunOptions,
  RenovateRunResult,
  RenovateWrapper,
} from '@secustor/plugin-renovate-common';
import { DockerContainerRunner } from '@backstage/backend-common';
import Docker from 'dockerode';
import { PassThrough } from 'stream';

const imageRepository = 'ghcr.io/renovatebot/renovate';
const imageTag = '37.269.5';

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

    const image = runtimeConfig.getOptionalString('image') ?? imageRepository;
    const tag = runtimeConfig.getOptionalString('tag') ?? imageTag;

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
