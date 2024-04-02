import { entityWithAnnotations } from '@secustor/backstage-plugin-renovate-common';
import { z } from 'zod';

export const target = z.union([z.string(), entityWithAnnotations]);

export const runRequestBody = z.object({
  target,
  callBackURL: z.string().url().optional(),
});
