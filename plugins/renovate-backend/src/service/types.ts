import { Config } from '@backstage/config';
import { DatabaseService, LoggerService } from '@backstage/backend-plugin-api';
import type { RepositoryReport } from '../schema/renovate';

export interface RouterOptions {
  rootConfig: Config;
  logger: LoggerService;
  database: DatabaseService;
}

export interface ReportsRow {
  last_updated: number;
  run_id: string;
  host: string;
  repository: string;
  report: RepositoryReport;
}

export interface Context extends RouterOptions {
  runtime?: 'direct';
  runID: string;
}
