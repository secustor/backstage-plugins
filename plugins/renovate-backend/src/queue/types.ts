export type AddStatus = 'already-running' | 'queued';

export interface AddResult {
  id: string;
  status: AddStatus;
}

export interface Runnable<T> {
  run(props: T): Promise<void>;
}

export interface RenovateQueue<T extends object> {
  /**
   * Adds a new job with jobId to the queue
   * @param jobId should be unique on the queue, if ids are colliding the job should be discarded
   * @param data which is supplied to the runnable
   * @param opts
   */
  add(jobId: string, data: T, opts?: QueueAddOptions): Promise<AddResult>;
  addBulk(
    entries: { jobId: string; data: T }[],
    opts?: QueueAddOptions,
  ): Promise<AddResult[]>;

  /**
   * Remove a job from the queue
   * @param jobId
   * @return true if removed and else false
   */
  remove(jobId: string): Promise<boolean>;
}

/**
 * Options for adding jobs into queues
 */
export interface QueueAddOptions {
  // should any existing job in the queue replaced. Should default to false
  force?: boolean;
  // should the job be added in the front. Defaults to false
  insertInFront?: boolean;
}
