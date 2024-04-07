import { Config } from '@backstage/config';
import {
  AuthService,
  DatabaseService,
  DiscoveryService,
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
  auth: AuthService;
  rootConfig: Config;
  logger: LoggerService;
  databaseHandler: DatabaseHandler;
  runtimes: Map<string, RenovateWrapper>;
  scheduler: SchedulerService;
  discovery: DiscoveryService;
}

export interface ReportsRow {
  task_id: string;
  last_updated: Date;
  host: string;
  repository: string;
  report: RepositoryReport;
}

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
