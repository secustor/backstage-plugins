/***/
/**
 * Node.js library for the renovate-wrapper plugin.
 *
 * @packageDocumentation
 */

import is from '@sindresorhus/is';
import { api } from './runtimes';
import { type RenovateReport } from '../schema/renovate';
import { getPlatformEnvs } from './platforms';
import { TargetRepo } from './types';
import { Context } from '../service/types';

/**
 * Renovates a repository and returns the report for this run
 *
 * @public
 */
export async function renovateRepository(
  target: TargetRepo,
  ctx: Context,
): Promise<RenovateReport> {
  const { rootConfig, runtime = 'direct' } = ctx;

  const wrapperRuntime = api.get(runtime);
  if (is.nullOrUndefined(wrapperRuntime)) {
    throw new Error(`Unknown runtime type '${runtime}'`);
  }

  const env: Record<string, string> = {
    // setup logging
    LOG_FORMAT: 'json',
    LOG_LEVEL: 'debug',
    LOG_CONTEXT: ctx.runID,
    RENOVATE_REPORT_TYPE: 'logging',
    // setup platform specifics
    ...getPlatformEnvs(target, ctx),
  };

  // read out renovate.config and write out to json file for consumption by Renovate
  const renovateConfig = rootConfig.getOptional('config') ?? {};
  const runLogger = ctx.logger.child({ runID: ctx.runID });
  const child = await wrapperRuntime.run({
    logger: runLogger,
    env,
    renovateConfig,
  });

  const promise: Promise<RenovateReport> = new Promise(resolve => {
    let uncompleteText = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      const text = uncompleteText.concat(chunk.toString());
      const logLines = text.split('\n');

      // if the last element is an empty string, then we have a complete json line so we reset it.
      // else we save it to
      uncompleteText = logLines.pop() ?? '';

      for (const logLine of logLines) {
        const log = JSON.parse(logLine);
        if (log.report) {
          // TODO use schema and reject if report does not fit expectation
          const report = log.report as RenovateReport;
          // do not forward the report to logging
          resolve(report);
        }
        const msg = log.msg;
        delete log.msg;
        // delete logContext as it is the same as runID
        delete log.logContext;
        runLogger.debug(msg, log);
      }
    });
  });

  return promise;
}
