import { z } from 'zod';

export const target = z.string();

export const runRequestBody = z.object({
  target,
});
