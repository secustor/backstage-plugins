import { JsonObject } from '@backstage/types';

export interface Config {
  renovate: {
    /**
     * Config for queue
     */
    queue: {

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
