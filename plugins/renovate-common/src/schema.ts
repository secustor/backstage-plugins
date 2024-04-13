import { z } from 'zod';

export const targetRepo = z.object({
  host: z.string(),
  repository: z.string(),
});

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

export const repositoryReportResponseElement = z.object({
  runID: z.string(),
  taskID: z.string(),
  timestamp: z.string().datetime(),
  host: z.string(),
  repository: z.string(),
  report: repositoryReport,
});
export type RepositoryReportResponseElement = z.infer<
  typeof repositoryReportResponseElement
>;

export const repositoryReportResponse = z.array(
  repositoryReportResponseElement,
);
export type RepositoryReportResponse = z.infer<typeof repositoryReportResponse>;
