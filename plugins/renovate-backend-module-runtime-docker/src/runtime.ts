import {
  RenovateRunOptions,
  RenovateRunResult,
  RenovateWrapper,
} from '@secustor/backstage-plugin-renovate-common';
import Docker from 'dockerode';
import { PassThrough } from 'stream';

const imageRepository = 'ghcr.io/renovatebot/renovate';
const imageTag = '39.22.0';

export class DockerRuntime implements RenovateWrapper {
  #runner: Docker;

  constructor() {
    this.#runner = new Docker();
  }

  async run({
    env,
    renovateConfig,
    runtimeConfig,
    logger,
  }: RenovateRunOptions): Promise<RenovateRunResult> {
    env.RENOVATE_CONFIG = JSON.stringify(renovateConfig);

    const image = runtimeConfig?.getOptionalString('image') ?? imageRepository;
    const tag = runtimeConfig?.getOptionalString('tag') ?? imageTag;
    const pullImage = runtimeConfig?.getOptionalBoolean('pullImage') ?? true;
    const imageName = `${image}:${tag}`;

    if (pullImage) {
      const pullStream = await this.#runner.pull(imageName);

      // Wait for pull to finish
      await new Promise(res =>
        this.#runner.modem.followProgress(pullStream, res, obj => {
          const message = obj.status;
          delete obj.status;
          logger.debug(message);
        }),
      );
    }

    const Env: string[] = Object.entries(env).map(
      ([key, value]) => `${key}=${value}`,
    );

    const stdout = new PassThrough();
    this.#runner.run(
      imageName,
      [],
      stdout,
      {
        Env,
        HostConfig: {
          AutoRemove: true, // container after running
        },
      },
      {},
    );

    return { stdout };
  }
}
