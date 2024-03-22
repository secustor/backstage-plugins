import { z } from 'zod';

export const problem = z.object({});

export const RepositoryReport = z.object({
  problems: z.array(problem),
  branches: z.array(z.any()),
  packageFiles: z.record(z.string(), z.any()),
});

export type RepositoryReport = z.infer<typeof RepositoryReport>;

export const RenovateReport = z.object({
  problems: z.array(problem),
  repositories: z.record(z.string(), RepositoryReport),
});

export type RenovateReport = z.infer<typeof RenovateReport>;
