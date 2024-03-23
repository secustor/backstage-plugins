import { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';

export interface PlatformEnvsOptions {
  rootConfig: Config;
  logger: LoggerService;
}
