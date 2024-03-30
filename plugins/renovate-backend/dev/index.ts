import { DatabaseManager, getRootLogger } from '@backstage/backend-common';
import yn from 'yn';
import { MockConfigApi } from '@backstage/test-utils';
import { startStandaloneServer } from '../src/service/standaloneServer';
import { TaskScheduler } from '@backstage/backend-tasks';

const port = process.env.PLUGIN_PORT ? Number(process.env.PLUGIN_PORT) : 7007;
const enableCors = yn(process.env.PLUGIN_CORS, { default: false });
const logger = getRootLogger();
const config = new MockConfigApi({});
const database = DatabaseManager.fromConfig(config).forPlugin('renovate');
const scheduler = TaskScheduler.fromConfig(config).forPlugin('renovate');

startStandaloneServer({
  database,
  port,
  enableCors,
  logger,
  config,
  scheduler,
}).catch(err => {
  logger.error(err);
  process.exit(1);
});

process.on('SIGINT', () => {
  logger.info('CTRL+C pressed; exiting.');
  process.exit(0);
});
