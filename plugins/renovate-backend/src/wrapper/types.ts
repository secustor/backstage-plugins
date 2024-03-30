import { Readable } from 'stream';
import { LoggerService } from '@backstage/backend-plugin-api';

export interface ExtractReportOptions {
  logStream: Readable;
  logger: LoggerService;
}

export interface RunOptions {
  logger: LoggerService;
}
