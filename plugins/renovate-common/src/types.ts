import { JsonValue } from '@backstage/types';
import { Readable } from 'stream';
import { Config } from '@backstage/config';
import { targetRepo } from './schema';
import { z } from 'zod';

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

export type TargetRepo = z.infer<typeof targetRepo>;
