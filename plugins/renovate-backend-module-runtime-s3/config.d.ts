export interface Config {
  renovate: {
    runtime: {
      /**
       * Configuration for the s3 runtime
       */
      s3: {
        /**
         * Bucket where are stored renovate report
         */
        bucket: string;

        /**
         * Region where is hosted bucket
         */
        region: string;

        /**
         * path to renovate report in bucket
         */
        key: string;

        /**
         * endpoint to s3
         */
        endpoint?: string;
      };
    };
  };
}