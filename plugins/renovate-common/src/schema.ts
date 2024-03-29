import { z } from 'zod';

export const targetRepo = z.object({
  host: z.string(),
  repository: z.string(),
});

export const entityWithAnnotations = z.object({
  metadata: z.object({
    annotations: z.record(z.string(), z.string()),
  }),
});

export type EntityWithAnnotations = z.infer<typeof entityWithAnnotations>;
