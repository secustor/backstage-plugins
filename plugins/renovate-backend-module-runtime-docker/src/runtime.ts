import {
    RenovateRunOptions, RenovateRunResult,
    RenovateWrapper,
} from '@secustor/plugin-renovate-common';
import {DockerContainerRunner} from '@backstage/backend-common'
import Docker from 'dockerode';
import {BufferStream} from "scramjet";

export class DockerRuntime implements RenovateWrapper {
  #docker: Docker = new Docker();

  async run({
    env,
    renovateConfig,
  }: RenovateRunOptions): Promise<RenovateRunResult> {
    env.RENOVATE_CONFIG = JSON.stringify(renovateConfig);

    const dockerEnv = Object.entries(env).map(
      ([key, value]) => `${key}=${value}`,
    );

    const image = 'ghcr.io/renovatebot/renovate:latest'

    await this.#docker.pull(image)
    const container = await this.#docker.createContainer({
      Env: dockerEnv,
      Image: image,
      HostConfig: { AutoRemove: true  },

    });
    await container.start()

    // const stdout = await container.attach({stream: true, logs: true, stdout: true})

    const temp = await container.logs({follow: true, stdout: true, details: false})
    const stdout = new BufferStream()
    temp.on('data', (chunk) => {
      const buffer = Buffer.from(chunk)
      const lines = buffer.toString().split("\n")
      for (const line of lines) {
        const cleaned = `${line.substring(line.indexOf('{'))}\n`
        stdout.push(Buffer.from(cleaned))
      }
    })

    return {stdout}
  }
}
