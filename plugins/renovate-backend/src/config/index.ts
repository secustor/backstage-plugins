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
  variant: 'jobSync' | 'renovation',
): TaskScheduleDefinition {
  try {
    const scheduleConfig = pluginConfig.getConfig(`schedules.${variant}`);
    return readTaskScheduleDefinitionFromConfig(scheduleConfig);
  } catch (e) {
    return {
      scope: 'global',
      timeout: { minutes: 60 },
      frequency: { minutes: 60 },
    };
  }
}
