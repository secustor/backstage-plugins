import { z } from 'zod';
import { targetRepo } from '@secustor/backstage-plugin-renovate-common';

export const target = z.string().or(targetRepo);

export const runRequestBody = z.object({
  target,
});
