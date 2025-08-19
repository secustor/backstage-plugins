import { JsonObject } from '@backstage/types';

export interface Config {
  renovate: {
    /**
     * Config for queue
     */
    queue: {
      /**
       * The queue to use. The value references id of a queue supplied by a module
       * For module-specific configuration sees the relevant module
       */
      type: string;

      redis?: {
        /**
         * Optional configuration for the Redis queue connection, overrides `backend.cache.redis.connection`
         */
        connection?: string;
      };
    };

    /**
     * Config for Renovate itself
     */
    config: JsonObject;
  };
}
