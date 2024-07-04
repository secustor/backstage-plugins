import { AddResult, QueueAddOptions, RenovateQueue, Runnable } from './types';
import Redis from 'ioredis';
import { Job, Queue, Worker } from 'bullmq';
import { LoggerService } from '@backstage/backend-plugin-api';

export class RedisQueue<T extends object> implements RenovateQueue<T> {
  private bullQueue: Queue<T, any, string>;

  constructor(cacheURL: string, logger: LoggerService, runnable: Runnable<T>) {
    const connection = new Redis(cacheURL, { maxRetriesPerRequest: null });
    const worker = new Worker(
      'renovate-runner',
      async (job: Job<T, any, string>) => runnable.run(job.data),
      {
        connection,
      },
    );
    logger.info(`Renovation worker started with ${worker.name}`);

    this.bullQueue = new Queue<T>('renovate-runner', {
      connection,
      defaultJobOptions: {
        removeOnFail: true,
        removeOnComplete: true,
      },
    });
  }

  async add(id: string, data: T, opts?: QueueAddOptions): Promise<AddResult> {
    const previousState = await this.bullQueue.getJobState(id);
    if (previousState === 'active') {
      return {
        id,
        status: 'already-running',
      };
    }

    await this.bullQueue.add('run', data, {
      jobId: id,
      lifo: opts?.insertInFront,
    });

    return {
      id,
      status: 'queued',
    };
  }

  async addBulk(
    entries: { jobId: string; data: T }[],
    opts?: QueueAddOptions,
  ): Promise<AddResult[]> {
    const props = entries.map(entry => {
      return {
        name: 'run',
        data: entry.data,
        opts: {
          jobId: entry.jobId,
          lifo: opts?.insertInFront,
        },
        previousState: this.bullQueue.getJobState(entry.jobId),
      };
    });
    if (opts?.force) {
      for (const prop of props) {
        await this.remove(prop.opts.jobId);
      }
    }

    await this.bullQueue.addBulk(props);

    const result: AddResult[] = [];
    for (const prop of props) {
      const previousState = await prop.previousState;
      const isActive = previousState === 'active';
      result.push({
        id: prop.opts.jobId,
        status: isActive ? 'already-running' : 'queued',
      });
    }
    return result;
  }

  async remove(jobId: string): Promise<boolean> {
    return Boolean(await this.bullQueue.remove(jobId));
  }
}
