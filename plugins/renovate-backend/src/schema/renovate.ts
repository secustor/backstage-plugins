import { z } from 'zod';

export const problem = z.object({});

export const repositoryReport = z.object({
  problems: z.array(problem),
  branches: z.array(z.any()),
  packageFiles: z.record(z.string(), z.any()),
});

export type RepositoryReport = z.infer<typeof repositoryReport>;

export const renovateReport = z.object({
  problems: z.array(problem),
  repositories: z.record(z.string(), repositoryReport),
});

export type RenovateReport = z.infer<typeof renovateReport>;
