import { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';

export interface EnabledScheduleDefinition extends SchedulerServiceTaskScheduleDefinition {
  /**
   * Whether the schedule is enabled
   * @default true
   */
  enabled?: boolean;
}
