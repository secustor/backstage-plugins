export type AddStatus = 'already-running' | 'queued';

export interface AddResult {
  id: string;
  status: AddStatus;
}

export interface Runnable<T> {
  run(props: T): Promise<void>;
}

export interface RenovateQueue<T extends object> {
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

export interface QueueAddOptions {
  force?: boolean;
  insertInFront?: boolean;
}
