/***/
/**
 * Node.js library for the renovate-wrapper plugin.
 *
 * @packageDocumentation
 */

import is from '@sindresorhus/is';
import { getPlatformEnvs } from './platforms';
import { RouterOptions } from '../service/types';
import { extractReport, getCacheEnvs } from './utils';
import {
  EntityWithAnnotations,
  getTargetRepo,
  getTaskID,
  RenovateReport,
  RenovateWrapper,
  TargetRepo,
} from '@secustor/backstage-plugin-renovate-common';
import { Config } from '@backstage/config';
import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import {
  getPluginConfig,
  getRenovateConfig,
  getRuntimeConfigs,
  getScheduleDefinition,
} from '../config';
import { DatabaseHandler } from '../service/databaseHandler';
import { RunOptions } from './types';
import { isError } from '@backstage/errors';

export class RenovateRunner {
  private scheduler: SchedulerService;
  private readonly rootConfig: Config;
  private databaseHandler: DatabaseHandler;
  private logger: LoggerService;
  private runtimes: Map<string, RenovateWrapper>;

  constructor(
    databaseHandler: DatabaseHandler,
    rootConfig: Config,
    logger: LoggerService,
    runtimes: Map<string, RenovateWrapper>,
    scheduler: SchedulerService,
  ) {
    this.databaseHandler = databaseHandler;
    this.rootConfig = rootConfig;
    this.logger = logger;
    this.runtimes = runtimes;
    this.scheduler = scheduler;
  }

  static async from(options: RouterOptions): Promise<RenovateRunner> {
    const { databaseHandler, rootConfig, runtimes, logger, scheduler } =
      options;

    return new RenovateRunner(
      databaseHandler,
      rootConfig,
      logger,
      runtimes,
      scheduler,
    );
  }

  private async renovate(
    id: string,
    target: TargetRepo,
    { logger }: RunOptions,
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
      ...getPlatformEnvs(target, {
        logger,
        rootConfig: this.rootConfig,
      }),
      ...getCacheEnvs(this.rootConfig, logger),
    };

    // read out renovate.config and write out to json file for consumption by Renovate
    // we are reading it at this place to allow dynamic configuration changes
    const renovateConfig = getRenovateConfig(this.rootConfig);

    const promise = wrapperRuntime.run({
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

  async run(id: string, target: TargetRepo): Promise<void> {
    const logger = this.logger.child({ taskID: id, ...target });
    try {
      logger.info('Renovate run starting');
      const report = await this.renovate(id, target, { logger });
      await this.databaseHandler.addReport({
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

  async trigger(
    target: string | EntityWithAnnotations | TargetRepo,
  ): Promise<void> {
    const id = getTaskID(target);
    const childLogger = this.logger.child({ taskID: id });

    // ensure there is runner scheduled
    await this.schedule(target);

    childLogger.debug('Triggering task');
    try {
      await this.scheduler.triggerTask(id);
    } catch (e) {
      childLogger.debug('Triggering task has failed', isError(e) ? e : {});
      throw e;
    }
  }

  async schedule(
    target: string | EntityWithAnnotations | TargetRepo,
  ): Promise<void> {
    const id = getTaskID(target);
    const childLogger = this.logger.child({ taskID: id });
    const targetRepo = getTargetRepo(target);

    // if the task is not locally scheduled do so, else only trigger it
    const schedules = await this.scheduler.getScheduledTasks();
    if (!schedules.some(task => task.id === id)) {
      childLogger.debug('Scheduling task');
      await this.scheduler.scheduleTask({
        id,
        fn: () => this.run(id, targetRepo),
        ...getScheduleDefinition(
          getPluginConfig(this.rootConfig),
          'renovation',
        ),
      });
    }
  }
}
