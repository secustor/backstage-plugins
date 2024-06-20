import { RouterOptions } from './types';
import { getPluginConfig, getScheduleDefinition } from '../config';

export async function scheduleCleanupTask(routerOptions: RouterOptions) {
  const { scheduler, rootConfig, databaseHandler, logger } = routerOptions;
  const pluginConfig = getPluginConfig(rootConfig);
  const schedule = getScheduleDefinition(pluginConfig, 'cleanup');
  const reportsToKeep =
    pluginConfig.getOptionalNumber('cleanup.minimumReports') ?? -1;

  return scheduler.scheduleTask({
    id: `renovate_report_cleanup`,
    ...schedule,
    fn: async () => {
      if (reportsToKeep >= 0) {
        logger.debug('Running report cleanup');
        const modified = await databaseHandler.deleteReports({
          keepLatest: reportsToKeep,
        });
        logger.debug(`Report cleanup completed. ${modified} reports deleted`);
      }
    },
  });
}
