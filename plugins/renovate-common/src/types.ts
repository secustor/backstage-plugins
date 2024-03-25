import { JsonValue } from '@backstage/types';

export interface RenovateWrapper {
  run(options: RenovateRunOptions): Promise<RenovateRunResult>;
}

export interface RenovateRunOptions {
  renovateConfig: JsonValue;
  env: Record<string, string>;
}

export interface RenovateRunResult {
  stdout: NodeJS.ReadableStream
}
