import { z } from 'zod';

export const targetRepo = z.object({
  host: z.string(),
  repository: z.string(),
});

export const problem = z.any();

export const update = z
  .object({
    updateType: z.string(),
    newVersion: z.string().optional(),
    lockedVersion: z.string().optional(),
    newValue: z.string().nullish(),
    newMajor: z.number().nullish(),
    newMinor: z.number().nullish(),
    newPatch: z.number().nullish(),
  })
  .passthrough();
export type Update = z.infer<typeof update>;

export const dependency = z
  .object({
    depName: z.string(),
    datasource: z.string().nullish(),
    depType: z.string().nullish(),
    currentValue: z.string().nullish(),
    skipReason: z.string().nullish(),
    currentVersion: z.string().nullish(),
    updates: z.array(update).nullish(),
    registryUrls: z.array(z.string()).nullish(),
  })
  .passthrough();

export const packageFile = z
  .object({
    packageFile: z.string(),
    packageFileVersion: z.string().nullish(),
    deps: z.array(dependency),
  })
  .passthrough();

export const branch = z
  .object({
    prNo: z.number().nullish(),
    upgrades: z.array(z.any()),
  })
  .passthrough();

export const packageFiles = z.record(z.string(), z.array(packageFile));
export type PackageFiles = z.infer<typeof packageFiles>;

export const repositoryReport = z
  .object({
    problems: z.array(problem),
    branches: z.array(branch),
    packageFiles,
  })
  .passthrough();
export type RepositoryReport = z.infer<typeof repositoryReport>;

export const renovateReport = z.object({
  problems: z.array(problem),
  repositories: z.record(z.string(), repositoryReport),
});
export type RenovateReport = z.infer<typeof renovateReport>;

export const repositoryReportResponseElement = z
  .object({
    runID: z.string(),
    taskID: z.string(),
    timestamp: z.string().datetime(),
    host: z.string(),
    repository: z.string(),
    report: repositoryReport,
  })
  .passthrough();
export type RepositoryReportResponseElement = z.infer<
  typeof repositoryReportResponseElement
>;

export const repositoryReportResponse = z.array(
  repositoryReportResponseElement,
);
export type RepositoryReportResponse = z.infer<typeof repositoryReportResponse>;
