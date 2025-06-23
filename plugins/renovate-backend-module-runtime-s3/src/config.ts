import { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';

export interface S3Config {
  bucket: string;
  region: string;
  key: string;
  endpoint?: string;
}

export function getS3Config(config: Config, logger: LoggerService): S3Config {
  try {
    const settings: S3Config = {
      bucket: config.getString('bucket'),
      region: config.getString('region'),
      key: config.getString('key'),
      endpoint: config.getOptionalString('endpoint'),
    };

    logger.debug('S3 configuration loaded successfully', {
      bucket: settings.bucket,
      region: settings.region,
      hasEndpoint: !!settings.endpoint,
    });

    return settings;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const message = `Invalid S3 configuration: ${errorMessage}. Required fields: bucket, region, key`;
    logger.error(message);
    throw new Error(message);
  }
}
