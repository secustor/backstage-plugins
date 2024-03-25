import { Readable } from 'stream';
import { LoggerService } from '@backstage/backend-plugin-api';

export interface TargetRepo {
  host: string;
  repository: string;
}

export interface ExtractReportOptions {
  logStream: Readable;
  logger: LoggerService;
}
