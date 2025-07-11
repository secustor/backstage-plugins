import { RenovateReport } from '@secustor/backstage-plugin-renovate-common';
import { ExtractReportOptions } from './types';
import { Config } from '@backstage/config';
import is from '@sindresorhus/is';
import { LoggerService } from '@backstage/backend-plugin-api';
import { getPluginConfig, getRuntimeConfigs } from '../config';
import { JsonObject } from '@backstage/types';

export async function extractReport(
  opts: ExtractReportOptions,
): Promise<RenovateReport> {
  const { logStream, logger } = opts;
  return new Promise((resolve, reject) => {
    let uncompletedText = '';
    logStream.on('data', (chunk: Buffer) => {
      const text = uncompletedText.concat(chunk.toString());
      const logLines = text.split('\n');

      // if the last element is an empty string, then we have a complete json line so we reset it.
      // else we save it to
      uncompletedText = logLines.pop() ?? '';

      for (const logLine of logLines) {
        const log: JsonObject = JSON.parse(logLine);
        if (log.report) {
          // TODO use schema and reject if report does not fit expectation
          const report = log.report as RenovateReport;
          // do not forward the report to logging
          resolve(report);
          continue;
        }

        const meta: JsonObject = {};
        // unpack log object
        for (const [key, value] of Object.entries(log)) {
          // skip fields which are transported outside of the meta object
          if (['msg', 'logContext', 'report'].includes(key)) {
            continue;
          }

          meta[key] = JSON.stringify(value);
        }

        const msg = is.string(log.msg) ? log.msg : JSON.stringify(log.msg);
        logger.debug(msg, meta);
      }
    });

    logStream.on('end', () => {
      if (uncompletedText) {
        logger.warn('Uncompleted log line found', { uncompletedText });
        reject(
          'Premature exit of Renovate. Uncompleted log line found in log stream after end of stream',
        );
      }
      reject('No report found in log stream');
    });
  });
}

export function getCacheEnvs(
  config: Config,
  logger: LoggerService,
): Record<string, string> {
  const cacheEnabled =
    getPluginConfig(config).getOptionalBoolean('cache.enabled') ?? true;
  if (!cacheEnabled) {
    logger.debug('Cache has been disabled in plugin configuration');
    return {};
  }

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

  logger.debug('Injecting Redis cache into Renovate');
  return {
    RENOVATE_REDIS_PREFIX: 'renovate_',
    RENOVATE_REDIS_URL: connection,
  };
}

export function getPassthroughEnvs(config: Config): Record<string, string> {
  const env: Record<string, string> = {};
  const passthroughEnvs = getRuntimeConfigs(config).environment;

  passthroughEnvs.forEach(e => {
    const name = e.getString('name');
    const value = e.getOptionalString('value') ?? undefined;
    env[name] = value ?? process.env[name] ?? '';
  });

  return env;
}
