import { AddResult, QueueAddOptions, RenovateQueue, Runnable } from './types';
import fastq from 'fastq';
import type { queueAsPromised } from 'fastq';
import { LoggerService } from '@backstage/backend-plugin-api';

/**
 * Queue for single instance use or dev setups
 */
export class LocalQueue<T extends object> implements RenovateQueue<T> {
  readonly id = 'local-fastq';
  private queue: queueAsPromised<T, void>;

  constructor(
    private readonly logger: LoggerService,
    runnable: Runnable<T>,
  ) {
    this.queue = fastq.promise(runnable, runnable.run, 1);
  }

  async add(
    jobId: string,
    data: T,
    opts?: QueueAddOptions,
  ): Promise<AddResult> {
    if (opts) {
      this.logger.warn(`AddOptions are not implement for ${this.id}`);
    }
    // we are not awaiting here as the promise resolved when the actual task is done
    if (opts?.insertInFront) {
      this.queue.unshift(data);
    } else {
      this.queue.push(data);
    }
    return {
      id: jobId,
      status: 'queued',
    };
  }

  async addBulk(
    entries: { jobId: string; data: T }[],
    opts?: QueueAddOptions,
  ): Promise<AddResult[]> {
    const result = entries.map(async entry => {
      // we are not awaiting here as the promise resolved when the actual task is done
      if (opts?.insertInFront) {
        this.queue.unshift(entry.data);
      } else {
        this.queue.push(entry.data);
      }
      return {
        id: entry.jobId,
        status: 'queued',
      } satisfies AddResult;
    });
    return Promise.all(result);
  }

  async remove(_jobId: string): Promise<boolean> {
    this.logger.warn(`Remove is not implemented for ${this.id}`);
    return false;
  }
}
