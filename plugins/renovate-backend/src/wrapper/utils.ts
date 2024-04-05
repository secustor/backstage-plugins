import { RenovateReport } from '@secustor/backstage-plugin-renovate-common';
import { ExtractReportOptions } from './types';
import { Config } from '@backstage/config';
import is from '@sindresorhus/is';
import { LoggerService } from '@backstage/backend-plugin-api';
import { getRenovateConfig } from '../config';

export async function extractReport(
  opts: ExtractReportOptions,
): Promise<RenovateReport> {
  const { logStream, logger } = opts;
  return new Promise(resolve => {
    let uncompletedText = '';
    logStream.on('data', (chunk: Buffer) => {
      const text = uncompletedText.concat(chunk.toString());
      const logLines = text.split('\n');

      // if the last element is an empty string, then we have a complete json line so we reset it.
      // else we save it to
      uncompletedText = logLines.pop() ?? '';

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
        logger.debug(msg, log);
      }
    });
  });
}

export function getCacheEnvs(
  config: Config,
  logger: LoggerService,
): Record<string, string> {
  const cacheConfig = config.getOptionalConfig('backend.cache');
  if (is.nullOrUndefined(cacheConfig)) {
    logger.debug('No cache configured');
    return {};
  }

  const store = cacheConfig.getString('store');
  if (store !== 'redis') {
    logger.debug(`Unsupported cache store '${store}' detected`);
    return {};
  }

  const connection = cacheConfig.getOptionalString('connection');
  if (is.nullOrUndefined(connection)) {
    logger.debug('No connection string for redis cache configured in backend');
    return {};
  }

  const redisUrl = getRenovateConfig(config);
  if (is.emptyObject(redisUrl)) {
    logger.debug('Renovate redis config set to null, skipping integration');
    return {};
  }

  logger.debug('Injecting Redis cache into Renovate');
  return {
    RENOVATE_REDIS_PREFIX: 'renovate_',
    RENOVATE_REDIS_URL: connection,
  };
}
