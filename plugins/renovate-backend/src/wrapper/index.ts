/***/
/**
 * Node.js library for the renovate-wrapper plugin.
 *
 * @packageDocumentation
 */

import is from '@sindresorhus/is';
import { getPlatformEnvs } from './platforms';
import { RouterOptions } from '../service/types';
import { extractReport } from './utils';
import {
  EntityWithAnnotations,
  getTargetRepo,
  getTaskID,
  RenovateReport,
  RenovateWrapper,
  TargetRepo,
} from '@secustor/plugin-renovate-common';
import { Config } from '@backstage/config';
import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import { getRuntime, getScheduleDefinition } from '../config';
import { DatabaseHandler } from '../service/databaseHandler';
import { TaskRunner } from '@backstage/backend-tasks';
import { RunOptions } from './types';

export class RenovateRunner {
  private scheduler: SchedulerService;
  private rootConfig: Config;
  private databaseHandler: DatabaseHandler;
  private pluginConfig: Config;
  private logger: LoggerService;
  private runtimes: Map<string, RenovateWrapper>;
  private runner: TaskRunner;

  constructor(
    databaseHandler: DatabaseHandler,
    rootConfig: Config,
    pluginConfig: Config,
    logger: LoggerService,
    runtimes: Map<string, RenovateWrapper>,
    runner: TaskRunner,
    scheduler: SchedulerService,
  ) {
    this.databaseHandler = databaseHandler;
    this.rootConfig = rootConfig;
    this.pluginConfig = pluginConfig;
    this.logger = logger;
    this.runtimes = runtimes;
    this.runner = runner;
    this.scheduler = scheduler;
  }

  static async from(options: RouterOptions): Promise<RenovateRunner> {
    const {
      databaseHandler,
      rootConfig,
      pluginConfig,
      runtimes,
      logger,
      scheduler,
    } = options;

    const scheduleConfig = getScheduleDefinition(pluginConfig);
    const runner = scheduler.createScheduledTaskRunner(scheduleConfig);

    return new RenovateRunner(
      databaseHandler,
      rootConfig,
      pluginConfig,
      logger,
      runtimes,
      runner,
      scheduler,
    );
  }

  private async renovate(
    id: string,
    target: TargetRepo,
    { logger }: RunOptions,
  ): Promise<RenovateReport> {
    const runtime = getRuntime(this.pluginConfig);
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
    };

    // read out renovate.config and write out to json file for consumption by Renovate
    // we are reading it at this place to allow dynamic configuration changes
    const renovateConfig = this.pluginConfig.getOptional('config') ?? {};
    const runtimeConfig =
      this.pluginConfig.getOptionalConfig(`runtime.${runtime}`) ?? null;

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
    const logger = this.logger.child({ runID: id, ...target });
    logger.info('Renovate run starting');
    const report = await this.renovate(id, target, { logger });
    await this.databaseHandler.addReport({
      taskID: id,
      report,
      target,
      logger,
    });
    logger.info('Renovate run finished');
  }

  async schedule(
    target: string | EntityWithAnnotations | TargetRepo,
  ): Promise<void> {
    const id = getTaskID(target);
    const targetRepo = getTargetRepo(target);

    // try to trigger existing schedule and if this fails, start a run.
    try {
      await this.scheduler.triggerTask(id);
      return;
    } catch (e) {
      await this.runner.run({
        id,
        fn: () => this.run(id, targetRepo),
      });
    }
  }
}
