import { createServiceBuilder } from '@backstage/backend-common';
import { Server } from 'http';
import { Logger } from 'winston';
import { createRouter } from './router';
import { Config } from '@backstage/config';
import { DatabaseService } from '@backstage/backend-plugin-api';
import { RenovateWrapper } from '@secustor/plugin-renovate-common';

export interface ServerOptions {
  port: number;
  enableCors: boolean;
  logger: Logger;
  config: Config;
  database: DatabaseService;
}

export async function startStandaloneServer(
  options: ServerOptions,
): Promise<Server> {
  const logger = options.logger.child({ service: 'renovate-backend' });
  logger.debug('Starting application server...');
  const router = await createRouter({
    database: options.database,
    logger,
    rootConfig: options.config,
    runtimes: new Map<string, RenovateWrapper>(),
  });

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
