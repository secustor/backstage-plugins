import { Config } from '@backstage/config';
import {
  readTaskScheduleDefinitionFromConfig,
  TaskScheduleDefinition,
} from '@backstage/backend-tasks';

export function getRuntime(pluginConfig: Config): string {
  return pluginConfig.getString('runtime.type');
}

export function getScheduleDefinition(
  pluginConfig: Config,
): TaskScheduleDefinition {
  const scheduleConfig = pluginConfig.getConfig('schedule');
  return readTaskScheduleDefinitionFromConfig(scheduleConfig);
}
