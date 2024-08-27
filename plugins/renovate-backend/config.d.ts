import { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';
import { JsonObject } from '@backstage/types';

export interface Config {
  renovate: {
    cache: {
      /**
       * Allows turning off cache injection. You can still manually supply caches using the Renovate config
       */
      enabled: boolean;
    };

    cleanup: {
      /**
       * How many reports to keep in the database during cleanup tasks
       * -1 translates to never delete reports during maintenance tasks
       * x > 0 number of reports to maintain
       */
      minimumReports: number;
    };

    schedules: {
      /**
       * Schedule for the cleanup task
       */
      cleanup: SchedulerServiceTaskScheduleDefinition;

      /**
       * Schedule when a renovation of all repositories should be triggered
       */
      renovation: SchedulerServiceTaskScheduleDefinition;
    };

    /**
     * Config for the renovate runtime
     */
    runtime: {
      /**
       * The runtime to use. The value references id of a runtime supplied by a module
       * For module-specific configuration sees the relevant module
       */
      type: string;
    };

    /**
     * Config for queues
     */
    queues: {
      /**
       * The queue to use. The value references id of a queue supplied by a module
       * For module-specific configuration sees the relevant module
       */
      type: string;
    };

    /**
     * Config for Renovate itself
     */
    config: JsonObject;
  };
}
