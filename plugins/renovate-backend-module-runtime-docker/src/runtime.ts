import {
  RenovateRunOptions,
  RenovateRunResult,
  RenovateWrapper,
} from '@secustor/backstage-plugin-renovate-common';
import Docker from 'dockerode';
import { PassThrough } from 'stream';

const imageRepository = 'ghcr.io/renovatebot/renovate';
const imageTag = '41.173.1';

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

      // Capture logger in closure
      const loggerRef = logger;

      // Wait for pull to finish
      await new Promise((resolve, reject) =>
        this.#runner.modem.followProgress(
          pullStream,
          (error: Error | null) => {
            if (error) {
              reject(error);
            } else {
              resolve(undefined);
            }
          },
          obj => {
            const message = obj.status;
            delete obj.status;
            if (loggerRef && message) {
              loggerRef.debug(message);
            }
          },
        ),
      );
    }

    const Env: string[] = Object.entries(env).map(
      ([key, value]) => `${key}=${value}`,
    );

    const stdout = new PassThrough();
    await this.#runner.run(
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
