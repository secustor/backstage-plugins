import { z } from 'zod';

export const targetRepo = z.object({
  host: z.string(),
  repository: z.string(),
});

export const problem = z.any();

export const NullishString = z.coerce
  .string()
  .optional()
  .catch(ctx => {
    if (ctx.input === null) return undefined;
    throw ctx.error;
  });

export const update = z
  .object({
    updateType: z.string(),
    newVersion: NullishString,
    lockedVersion: NullishString,
    newValue: NullishString,
    newMajor: z.number().nullish(),
    newMinor: z.number().nullish(),
    newPatch: z.number().nullish(),
  })
  .passthrough();
export type Update = z.infer<typeof update>;

export const dependency = z
  .object({
    depName: NullishString,
    datasource: NullishString,
    packageName: NullishString,
    depType: NullishString,
    currentValue: NullishString,
    skipReason: NullishString,
    currentVersion: NullishString,
    updates: z.array(update).optional(),
    registryUrl: NullishString,
    sourceUrl: NullishString,
    currentVersionTimestamp: z.coerce.date().optional(),
  })
  .passthrough();

export const packageFile = z
  .object({
    packageFile: z.string(),
    packageFileVersion: NullishString,
    datasource: NullishString,
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

export const libYears = z.object({
  managerLibYears: z.record(z.string(), z.number()),
  totalLibYears: z.number(),
  totalDepsCount: z.number(),
  outdatedDepsCount: z.number(),
});

export const repositoryReport = z
  .object({
    problems: z.array(problem),
    branches: z.array(branch),
    packageFiles,
    libYears: libYears.optional(),
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
    timestamp: z.coerce.date(),
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
