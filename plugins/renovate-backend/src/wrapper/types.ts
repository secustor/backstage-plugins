import { Readable } from 'stream';
import { LoggerService } from '@backstage/backend-plugin-api';
import { TargetRepo } from '@secustor/backstage-plugin-renovate-common';

export interface ExtractReportOptions {
  logStream: Readable;
  logger: LoggerService;
}

export interface RunOptions {
  id: string;
  target: TargetRepo;
}
