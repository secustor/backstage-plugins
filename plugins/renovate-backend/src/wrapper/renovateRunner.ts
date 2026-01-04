import is from '@sindresorhus/is';
import { getPlatformEnvs } from './platforms';
import { RouterOptions } from '../service/types';
import { extractReport, getCacheEnvs, getPassthroughEnvs } from './utils';
import {
  getTargetRepo,
  getTaskID,
  RenovateReport,
  RenovateWrapper,
  TargetRepo,
} from '@secustor/backstage-plugin-renovate-common';
import { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import { getRenovateConfig, getRuntimeConfigs } from '../config';
import { DatabaseHandler } from '../service/databaseHandler';
import { isError } from '@backstage/errors';
import { Entity } from '@backstage/catalog-model';
import { nanoid } from 'nanoid';
import { createQueue } from '../queue';
import {
  AddResult,
  QueueFactory,
  RenovateQueue,
  Runnable,
  RunOptions,
} from '@secustor/backstage-plugin-renovate-node';

export class RenovateRunner implements Runnable<RunOptions> {
  private readonly queue: RenovateQueue<RunOptions>;

  constructor(
    queueFactories: Map<string, QueueFactory<RunOptions>>,
    private readonly databaseHandler: DatabaseHandler,
    private readonly rootConfig: Config,
    readonly logger: LoggerService,
    private readonly runtimes: Map<string, RenovateWrapper>,
  ) {
    this.queue = createQueue(queueFactories, rootConfig, this);
  }

  static async from(options: RouterOptions): Promise<RenovateRunner> {
    const { databaseHandler, rootConfig, runtimes, logger, queueFactories } =
      options;

    return new RenovateRunner(
      queueFactories,
      databaseHandler,
      rootConfig,
      logger,
      runtimes,
    );
  }

  async addToQueue(
    ...targets: (string | Entity | TargetRepo)[]
  ): Promise<AddResult[]> {
    const props = targets.map(target => {
      const jobId = getTaskID(target);
      const targetRepo = getTargetRepo(target);
      return {
        jobId,
        data: {
          id: jobId,
          target: targetRepo,
        },
      };
    });

    return await this.queue.addBulk(props);
  }

  async runNext(target: string | Entity | TargetRepo): Promise<AddResult> {
    const jobId = getTaskID(target);
    const targetRepo = getTargetRepo(target);

    return await this.queue.add(
      jobId,
      { id: jobId, target: targetRepo },
      {
        force: true,
        insertInFront: true,
      },
    );
  }

  async run(props: RunOptions): Promise<void> {
    const { id, target } = props;
    const runID = nanoid();
    const logger = this.logger.child({ runID, jobID: id, ...target });
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

  async renovate(
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
      ...process.env,
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
      ...getPassthroughEnvs(this.rootConfig, logger),
    };

    // read out renovate.config and write out to json file for consumption by Renovate
    // we are reading it at this place to allow dynamic configuration changes
    const renovateConfig = getRenovateConfig(this.rootConfig);

    const promise = wrapperRuntime.run({
      runID: id,
      env,
      renovateConfig,
      runtimeConfig,
      logger,
    });

    return promise.then(result => {
      return extractReport({
        logger,
        logStream: result.stdout,
      });
    });
  }
}
