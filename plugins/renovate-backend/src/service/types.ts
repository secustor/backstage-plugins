import { Config } from '@backstage/config';
import { DatabaseService, LoggerService } from '@backstage/backend-plugin-api';
import type { RepositoryReport } from '../schema/renovate';
import { RenovateWrapper } from '@secustor/plugin-renovate-common';

export interface RouterOptions {
  rootConfig: Config;
  logger: LoggerService;
  database: DatabaseService;
  runtimes: Map<string, RenovateWrapper>;
}

export interface ReportsRow {
  last_updated: number;
  run_id: string;
  host: string;
  repository: string;
  report: RepositoryReport;
}

export interface Context extends RouterOptions {
  pluginConfig: Config;
  runtime: string;
  runID: string;
}

export interface ReportQueryParameters {
  host: string;
  repository: string;
}
