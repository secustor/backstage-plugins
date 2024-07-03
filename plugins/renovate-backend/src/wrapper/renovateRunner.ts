import is from '@sindresorhus/is';
import { getPlatformEnvs } from './platforms';
import { RouterOptions } from '../service/types';
import { extractReport, getCacheEnvs } from './utils';
import {
  getTargetRepo,
  getTaskID,
  RenovateReport,
  RenovateWrapper,
  TargetRepo,
} from '@secustor/backstage-plugin-renovate-common';
import { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  getCacheConfig,
  getRenovateConfig,
  getRuntimeConfigs,
} from '../config';
import { DatabaseHandler } from '../service/databaseHandler';
import { RunOptions } from './types';
import { isError } from '@backstage/errors';
import { Entity } from '@backstage/catalog-model';
import { nanoid } from 'nanoid';
import { Job, Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

export class RenovateRunner {
  // @ts-ignore
  private readonly worker: Worker<RunOptions, any, string>;
  private readonly queue: Queue<RunOptions, any, string>;

  constructor(
    private readonly databaseHandler: DatabaseHandler,
    private readonly rootConfig: Config,
    private readonly logger: LoggerService,
    private readonly runtimes: Map<string, RenovateWrapper>,
  ) {
    const cacheURL = getCacheConfig(rootConfig);

    if (!cacheURL) {
      // TODO implement local queue
      throw new Error('No cache URL found for renovate runner');
    }

    const connection = new Redis(cacheURL, { maxRetriesPerRequest: null });
    this.worker = new Worker(
      'renovate-runner',
      async (job: Job<RunOptions, any, string>) => this.run(job.data),
      {
        connection,
      },
    );

    this.queue = new Queue('renovate-runner', { connection });
  }

  static async from(options: RouterOptions): Promise<RenovateRunner> {
    const { databaseHandler, rootConfig, runtimes, logger } = options;

    return new RenovateRunner(databaseHandler, rootConfig, logger, runtimes);
  }

  async addToQueue(
    ...targets: (string | Entity | TargetRepo)[]
  ): Promise<Job<RunOptions, any, string>[]> {
    const props = targets.map(target => {
      const jobId = getTaskID(target);
      const targetRepo = getTargetRepo(target);
      return {
        name: 'run',
        data: {
          id: jobId,
          target: targetRepo,
        },
        opts: {
          jobId,
          removeOnComplete: true,
          removeOnFail: true,
        },
      };
    });

    return await this.queue.addBulk(props);
  }

  async runNext(
    target: string | Entity | TargetRepo,
  ): Promise<'active' | Job<any, any, string>> {
    const jobId = getTaskID(target);
    const targetRepo = getTargetRepo(target);
    // if the job is already on queue, then remove it and put it in the first position
    const state = await this.queue.getJobState(jobId);

    if (state === 'active') {
      return state;
    }
    await this.queue.remove(jobId);
    return await this.queue.add(
      'run',
      { id: jobId, target: targetRepo },
      { jobId, lifo: true, removeOnFail: true, removeOnComplete: true },
    );
  }

  private async run(props: RunOptions): Promise<void> {
    const { id, target } = props;
    const runID = nanoid();
    const logger = this.logger.child({ runID, taskID: id, ...target });
    try {
      logger.info('Renovate run starting');
      const report = await this.renovate(props, logger);
      await this.databaseHandler.addReport({
        runID,
        taskID: id,
        report,
        target,
        logger,
      });
      logger.info('Renovate run successfully finished');
    } catch (e) {
      logger.error('Renovate failed', isError(e) ? e : {});
    }
  }

  private async renovate(
    { id, target }: RunOptions,
    logger: LoggerService,
  ): Promise<RenovateReport> {
    const { runtime, config: runtimeConfig } = getRuntimeConfigs(
      this.rootConfig,
    );
    const wrapperRuntime = this.runtimes.get(runtime);
    if (is.nullOrUndefined(wrapperRuntime)) {
      throw new Error(`Unknown runtime type '${runtime}'`);
    }

    const env: Record<string, string> = {
      // setup logging
      LOG_FORMAT: 'json',
      LOG_LEVEL: 'debug',
      LOG_CONTEXT: id,
      RENOVATE_REPORT_TYPE: 'logging',
      // setup platform specifics
      ...(await getPlatformEnvs(target, {
        logger,
        rootConfig: this.rootConfig,
      })),
      ...getCacheEnvs(this.rootConfig, logger),
    };

    // read out renovate.config and write out to json file for consumption by Renovate
    // we are reading it at this place to allow dynamic configuration changes
    const renovateConfig = getRenovateConfig(this.rootConfig);

    const promise = wrapperRuntime.run({
      runID: id,
      env,
      renovateConfig,
      runtimeConfig,
    });

    return await promise.then(result => {
      return extractReport({
        logger,
        logStream: result.stdout,
      });
    });
  }
}
