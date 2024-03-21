import { JsonValue } from '@backstage/types';
import { LoggerService } from '@backstage/backend-plugin-api';
import { ChildProcess } from 'node:child_process';

export interface RenovateWrapper {
  run(options: RenovateRunOptions): Promise<ChildProcess>;
}

export interface RenovateRunOptions {
  logger: LoggerService;
  renovateConfig: JsonValue;
  env: Record<string, string>;
}
