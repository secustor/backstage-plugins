import {
  LoggerService,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import {
  AddReportParameters,
  DatabaseCreationParameters,
  DeleteOptions,
  DependenciesFilter,
  DependencyRow,
  ReportQueryParameters,
  ReportsRow,
  ReportTargetQuery,
} from './types';
import is from '@sindresorhus/is';
import { RepositoryReportResponse } from '@secustor/backstage-plugin-renovate-common';

const migrationsDir = resolvePackagePath(
  '@secustor/backstage-plugin-renovate-backend',
  'migrations',
);

export class DatabaseHandler {
  static async create(
    options: DatabaseCreationParameters,
  ): Promise<DatabaseHandler> {
    const { database, logger } = options;
    const client = await database.getClient();

    if (!database.migrations?.skip) {
      await client.migrate.latest({
        directory: migrationsDir,
      });
    }

    return new DatabaseHandler(client, logger);
  }

  private constructor(
    private client: Knex,
    private logger: LoggerService,
  ) {}

  async addReport(options: AddReportParameters): Promise<void> {
    const { runID, taskID, report, target } = options;
    const logger = options.logger ?? this.logger;

    const timestamp = new Date();

    const inserts: ReportsRow[] = [];
    for (const [repository, value] of Object.entries(report.repositories)) {
      inserts.push({
        run_id: runID,
        task_id: taskID,
        timestamp,
        host: target.host,
        repository,
        report: value,
      });
    }
    // this.client.batchInsert<ReportsRow>('reports', inserts);
    await this.client('reports')
      .insert(inserts)
      .catch(reason => logger.error('Failed insert data', reason));

    await this.updateDependencies(timestamp, options);
  }

  async getReports(
    query?: ReportQueryParameters,
  ): Promise<RepositoryReportResponse> {
    const builder = this.client.select<ReportsRow[]>();
    if (query) {
      builder.where(query);
    }
    const rows = await builder.from<ReportsRow[]>('reports');
    return rows.map(row => {
      return {
        runID: row.run_id,
        taskID: row.task_id,
        timestamp: row.timestamp.toISOString(),
        host: row.host,
        repository: row.repository,
        // if the JSON field has not been auto-parsed do it manually
        report: is.string(row.report) ? JSON.parse(row.report) : row.report,
      };
    });
  }

  async getTargets(): Promise<ReportTargetQuery[]> {
    return this.client
      .select()
      .distinct<ReportsRow[]>('host', 'repository')
      .from('reports');
  }

  async deleteReportsByTarget(
    { host, repository }: ReportTargetQuery,
    options?: DeleteOptions,
  ): Promise<number> {
    const offset = getOffset(options);

    const toBeDeletedIDs = this.client('reports')
      .select('run_id')
      .where('host', host)
      .andWhere('repository', repository)
      .orderBy('timestamp', 'DESC')
      .offset(offset);

    return this.client('reports').delete().whereIn('run_id', [toBeDeletedIDs]);
  }

  async deleteReports(options?: DeleteOptions): Promise<number> {
    const targets = await this.getTargets();
    const modified = await Promise.all(
      targets.map(target => this.deleteReportsByTarget(target, options)),
    );
    // sum up
    return modified.reduce((a, b) => a + b, 0);
  }

  private async updateDependencies(
    timestamp: Date,
    options: AddReportParameters,
  ): Promise<void> {
    const { runID, report, target } = options;
    const dependencies: DependencyRow[] = [];
    for (const [repository, repositoryContent] of Object.entries(
      report.repositories,
    )) {
      for (const [manager, packageFiles] of Object.entries(
        repositoryContent.packageFiles,
      )) {
        for (const packageFile of packageFiles) {
          const packageFilePath = packageFile.packageFile;
          for (const dependency of packageFile.deps) {
            const {
              packageName,
              depName,
              depType,
              datasource,
              currentValue,
              currentVersion,
              skipReason,
              registryUrl,
              sourceUrl,
              currentVersionTimestamp,
            } = dependency;
            dependencies.push({
              run_id: runID,
              host: target.host,
              extractionTimestamp: timestamp,
              repository,
              manager,
              datasource:
                datasource ?? packageFile.datasource ?? 'no-datasource',
              depName,
              packageName,
              packageFile: packageFilePath,
              depType,
              currentValue,
              currentVersion,
              currentVersionTimestamp,
              skipReason,
              registryUrl,
              sourceUrl,
            });
          }
        }
      }
    }
    await this.client('dependencies').insert(dependencies);
  }

  async getDependencies(filters: DependenciesFilter): Promise<DependencyRow[]> {
    const builder = this.client('dependencies').select<DependencyRow[]>();

    if (filters.host) {
      builder.whereIn('host', filters.host);
    }
    if (filters.repository) {
      builder.whereIn('repository', filters.repository);
    }
    if (filters.manager) {
      builder.whereIn('manager', filters.manager);
    }
    if (filters.datasource) {
      builder.whereIn('datasource', filters.datasource);
    }
    if (filters.depName) {
      builder.whereIn('depName', filters.depName);
    }

    if (filters.latestOnly) {
      const runIDs = this.client('dependencies')
        .select('d.run_id')
        .from('dependencies as d')
        .join(
          this.client('dependencies')
            .select('host', 'repository')
            .max('extractionTimestamp as max_timestamp')
            .groupBy('host', 'repository')
            .as('max_d'),
          // eslint-disable-next-line func-names
          function () {
            this.on('d.host', '=', 'max_d.host')
              .andOn('d.repository', '=', 'max_d.repository')
              .andOn('d.extractionTimestamp', '=', 'max_d.max_timestamp');
          },
        )
        .distinct();

      builder.whereIn('run_id', runIDs);
    }

    return builder.limit(filters.limit ?? 500);
  }

  async deleteDependencies(options: DeleteOptions): Promise<number> {
    const targets = await this.getTargets();
    const modified = await Promise.all(
      targets.map(target => this.deleteDependenciesByTarget(target, options)),
    );
    // sum up
    return modified.reduce((a, b) => a + b, 0);
  }

  async deleteDependenciesByTarget(
    { host, repository }: ReportTargetQuery,
    options?: DeleteOptions,
  ): Promise<number> {
    const offset = getOffset(options);

    const dependencies = this.client('dependencies')
      .select('run_id', 'extractionTimestamp')
      .distinct('host', 'repository')
      .where('host', host)
      .andWhere('repository', repository);

    const toBeDeletedIDs = this.client(dependencies)
      .select('run_id')
      .orderBy('extractionTimestamp', 'DESC')
      .offset(offset);

    return this.client('dependencies')
      .delete()
      .whereIn('run_id', [toBeDeletedIDs]);
  }
}

function getOffset(options?: DeleteOptions): number {
  let offset = 0;
  if (
    is.nullOrUndefined(options?.keepLatest) ||
    is.boolean(options?.keepLatest)
  ) {
    offset = options?.keepLatest ? 1 : 0;
  } else {
    offset = options.keepLatest;
  }
  return offset;
}
