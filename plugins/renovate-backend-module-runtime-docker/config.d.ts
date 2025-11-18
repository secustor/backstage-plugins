export interface Config {
  renovate: {
    runtime: {
      /**
       * Configuration for the Docker runtime
       */
      docker: {
        /**
         * Controls if the Docker image should be pulled before running the container.
         * Default: true
         */
        pullImage: boolean;

        /**
         * The Docker image to use
         * Default: 'ghcr.io/renovatebot/renovate'
         */
        image: string;

        /**
         * The Docker image tag to use
         * Default: '42.14.2'
         */
        tag: string;
      };
    };
  };
}
