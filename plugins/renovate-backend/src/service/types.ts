import { Config } from '@backstage/config';
import {
  DatabaseService,
  LoggerService,
  SchedulerService,
} from '@backstage/backend-plugin-api';
import {
  RenovateReport,
  RenovateWrapper,
  RepositoryReport,
  TargetRepo,
} from '@secustor/backstage-plugin-renovate-common';
import { DatabaseHandler } from './databaseHandler';

export interface RouterOptions {
  rootConfig: Config;
  pluginConfig: Config;
  logger: LoggerService;
  databaseHandler: DatabaseHandler;
  runtimes: Map<string, RenovateWrapper>;
  scheduler: SchedulerService;
}

export interface ReportsRow {
  task_id: string;
  last_updated: number;
  host: string;
  repository: string;
  report: RepositoryReport;
}

export interface Context extends RouterOptions {}

export interface DatabaseCreationParameters {
  database: DatabaseService;
  logger: LoggerService;
}

export interface ReportQueryParameters {
  host?: string;
  repository?: string;
}

export interface AddReportParameters {
  taskID: string;
  report: RenovateReport;
  target: TargetRepo;
  logger?: LoggerService;
}
