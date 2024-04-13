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
  run_id: string;
  task_id: string;
  timestamp: Date;
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
  runID: string;
  taskID: string;
  report: RenovateReport;
  target: TargetRepo;
  logger?: LoggerService;
}
