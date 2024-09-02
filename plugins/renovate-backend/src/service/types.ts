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
import {
  QueueFactory,
  RunOptions,
} from '@secustor/backstage-plugin-renovate-node';

export interface RouterOptions {
  auth: AuthService;
  rootConfig: Config;
  logger: LoggerService;
  databaseHandler: DatabaseHandler;
  runtimes: Map<string, RenovateWrapper>;
  queueFactories: Map<string, QueueFactory<RunOptions>>;
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

export interface DependencyRow {
  id?: string;
  run_id: string;
  host: string;
  repository: string;
  extractionTimestamp: Date;
  manager: string;
  datasource: string;
  packageFile: string;
  depName: string;
  packageName?: string;
  depType?: string;
  currentValue?: string;
  currentVersion?: string;
  currentVersionTimestamp?: Date;
  skipReason?: string;
  registryUrl?: string;
  sourceUrl?: string;
  currentVersionReleased?: Date;
}

export interface ReportTargetQuery {
  host?: string;
  repository?: string;
}

export interface DeleteOptions {
  /**
   * If falsely (0, false or undefined) delete all reports
   * If keepLatest is a number keep this number of records.
   * In case it is boolean true, the behaviour is identical to 1
   */
  keepLatest?: boolean | number;
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

export interface DependenciesFilter {
  datasource?: string[];
  depName?: string[];
  depType?: string[];
  host?: string[];
  latestOnly?: boolean;
  limit?: number;
  manager?: string[];
  packageFile?: string[];
  repository?: string[];
}
