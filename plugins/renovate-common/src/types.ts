import { JsonValue } from '@backstage/types';
import { Readable } from 'stream';
import { Config } from '@backstage/config';

export interface RenovateWrapper {
  run(options: RenovateRunOptions): Promise<RenovateRunResult>;
}

export interface RenovateRunOptions {
  renovateConfig: JsonValue;
  env: Record<string, string>;
  runtimeConfig: Config;
}

export interface RenovateRunResult {
  stdout: Readable;
}
