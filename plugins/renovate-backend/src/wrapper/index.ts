/***/
/**
 * Node.js library for the renovate-wrapper plugin.
 *
 * @packageDocumentation
 */

import is from '@sindresorhus/is';
import { type RenovateReport } from '../schema/renovate';
import { getPlatformEnvs } from './platforms';
import { TargetRepo } from './types';
import { Context } from '../service/types';
import { extractReport } from './utils';
import { MockConfigApi } from '@backstage/test-utils';

/**
 * Renovates a repository and returns the report for this run
 *
 * @public
 */
export async function renovateRepository(
  target: TargetRepo,
  ctx: Context,
): Promise<RenovateReport> {
  const { pluginConfig, runtime } = ctx;

  const wrapperRuntime = ctx.runtimes.get(runtime);
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
  const renovateConfig = pluginConfig.getOptional('config') ?? {};
  const runtimeConfig =
    pluginConfig.getOptionalConfig(`runtime.${runtime}`) ??
    new MockConfigApi({});
  const result = await wrapperRuntime.run({
    env,
    renovateConfig,
    // do not fail, but rather return an empty config
    runtimeConfig,
  });

  return await extractReport({
    logger: ctx.logger.child({ runID: ctx.runID }),
    logStream: result.stdout,
  });
}
