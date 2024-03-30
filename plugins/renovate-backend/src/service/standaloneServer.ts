import { createServiceBuilder } from '@backstage/backend-common';
import { Server } from 'http';
import { Logger } from 'winston';
import { createRouter } from './router';
import { Config } from '@backstage/config';
import {
  DatabaseService,
  SchedulerService,
} from '@backstage/backend-plugin-api';
import { RenovateWrapper } from '@secustor/plugin-renovate-common';
import { RenovateRunner } from '../wrapper';
import { DatabaseHandler } from './databaseHandler';

export interface ServerOptions {
  port: number;
  enableCors: boolean;
  logger: Logger;
  config: Config;
  database: DatabaseService;
  scheduler: SchedulerService;
}

export async function startStandaloneServer(
  options: ServerOptions,
): Promise<Server> {
  const logger = options.logger.child({ service: 'renovate-backend' });
  const ctx = {
    databaseHandler: await DatabaseHandler.create(options),
    logger,
    rootConfig: options.config,
    pluginConfig: options.config.getConfig('renovate'),
    scheduler: options.scheduler,
    runtimes: new Map<string, RenovateWrapper>(),
  };
  const runner = await RenovateRunner.from(ctx);
  logger.debug('Starting application server...');
  const router = await createRouter(runner, ctx);

  let service = createServiceBuilder(module)
    .setPort(options.port)
    .addRouter('/renovate', router);
  if (options.enableCors) {
    service = service.enableCors({ origin: 'http://localhost:3000' });
  }

  return await service.start().catch(err => {
    logger.error(err);
    process.exit(1);
  });
}

module.hot?.accept();
