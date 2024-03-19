import { z } from 'zod';

export const entityWithAnnotations = z.object({
  metadata: z.object({
    annotations: z.record(z.string(), z.string()),
  }),
});

export type EntityWithAnnotations = z.infer<typeof entityWithAnnotations>

export const runRequestBody = z.object({
  target: z.union([z.string(), entityWithAnnotations]),
  callBackURL: z.string().url().optional(),
});
