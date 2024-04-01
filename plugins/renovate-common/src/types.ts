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
  /*
    Configuration which has been defined to the registered runtime.
    E.g., in case for 'docker' the config of with the key `renovate.runtime.docker`.
    Null if the runtime key is not defined
   */
  runtimeConfig: Config | null;
}

export interface RenovateRunResult {
  stdout: Readable;
}

export type TargetRepo = z.infer<typeof targetRepo>;
