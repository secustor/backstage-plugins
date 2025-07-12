import { JsonObject } from '@backstage/types';
import { EnabledScheduleDefinition } from './src/config/types';

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
       * -1 translates to never delete reports during maintenance
       * x > 0 number of reports to maintain
       */
      minimumReports: number;

      /**
       * How many dependency history entries to keep in the database during cleanup tasks
       * -1 translates to never delete entries during maintenance
       * x > 0 number of dependencies to maintain
       */
      dependencyHistory: number;
    };

    schedules: {
      /**
       * Schedule for the cleanup task
       */
      cleanup?: EnabledScheduleDefinition;

      /**
       * Schedule when a renovation of all repositories should be triggered
       */
      renovation?: EnabledScheduleDefinition;
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

      /**
       * Runtime environment variables
       */
      environment?: Array<{
        /**
         * Name of the environment variable
         */
        name: string;
        /**
         *  Optional explicit value (falls back to `process.env[name]`)
         */
        value?: string;
      }>;
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
