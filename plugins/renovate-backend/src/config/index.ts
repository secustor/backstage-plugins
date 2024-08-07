import { Config } from '@backstage/config';
import {
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
  SchedulerServiceTaskScheduleDefinition,
} from '@backstage/backend-plugin-api';
import { JsonValue } from '@backstage/types';

export const RENOVATE_ANNOTATION_KEEP_UPDATED =
  'renovate.secustor.dev/keep-updated';

export function getPluginConfig(rootConfig: Config): Config {
  return rootConfig.getConfig('renovate');
}

export function getRenovateConfig(rootConfig: Config): JsonValue {
  const value = getPluginConfig(rootConfig).getOptional('config');
  return value ?? null;
}

export function getRuntimeConfigs(rootConfig: Config): {
  runtime: string;
  config: Config | null;
} {
  const runtimeConfig = getPluginConfig(rootConfig).getConfig('runtime');
  const runtime = runtimeConfig.getString('type');
  return {
    runtime,
    config: runtimeConfig.getConfig(runtime),
  };
}

export function getScheduleDefinition(
  pluginConfig: Config,
  variant: 'renovation' | 'cleanup',
): SchedulerServiceTaskScheduleDefinition {
  try {
    const scheduleConfig = pluginConfig.getConfig(`schedules.${variant}`);
    return readSchedulerServiceTaskScheduleDefinitionFromConfig(scheduleConfig);
  } catch (e) {
    return {
      scope: 'global',
      timeout: { minutes: 60 },
      frequency: { minutes: 60 },
    };
  }
}
