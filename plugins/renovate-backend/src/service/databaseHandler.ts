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
  DependencyValueFilters,
  DependencyValueFiltersKey,
  DependencyValueFiltersKeys,
  DependencyValues,
  Pagination,
  PaginationOptions,
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
        timestamp: row.timestamp,
        host: row.host,
        repository: row.repository,
        // if the JSON field has not been auto-parsed do it manually
        report: is.string(row.report) ? JSON.parse(row.report) : row.report,
      };
    });
  }

  async getTargets(
    table: 'reports' | 'dependencies' = 'reports',
  ): Promise<ReportTargetQuery[]> {
    return this.client
      .select()
      .distinct<ReportsRow[]>('host', 'repository')
      .from(table);
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

            // TODO remove this once Renovate enforces packageName
            const massagedDepName = depName ?? packageName;
            if (!massagedDepName) {
              continue;
            }

            dependencies.push({
              run_id: runID,
              host: target.host,
              extractionTimestamp: timestamp,
              repository,
              manager,
              datasource:
                datasource ?? packageFile.datasource ?? 'no-datasource',
              depName: massagedDepName,
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

  async getDependencies(
    filters: DependenciesFilter,
    pagination?: Partial<PaginationOptions>,
  ): Promise<Pagination<DependencyRow[]>> {
    const page = pagination?.page ?? 0;
    const pageSize = pagination?.pageSize ?? 500;
    const builder = this.client('dependencies').select<DependencyRow[]>();

    this.applyDependencyFilters(builder, filters);

    const total = await this.getDependenciesCount(filters);

    const offset = page * pageSize;
    return {
      result: await builder.offset(offset).limit(pageSize),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  async getDependenciesCount(filters: DependenciesFilter): Promise<number> {
    const builder = this.client('dependencies').count({ count: '*' });

    this.applyDependencyFilters(builder, filters);

    const count = await builder.first().then(result => result?.count);
    if (is.string(count)) {
      return Number.parseInt(count, 10);
    }
    return count ?? 0;
  }

  private applyDependencyFilters(
    builder: Knex.QueryBuilder,
    filters: DependenciesFilter,
  ): void {
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
    if (filters.depType) {
      builder.whereIn('depType', filters.depType);
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
  }

  /**
   * Gets the available values for the dependencies stored in the database.
   * If filters are supplied, OTHER values are filtered accordingly, if a filter is supplied, all values are returned
   * @param filters
   */
  async getDependenciesValues(
    filters?: DependencyValueFilters,
  ): Promise<DependencyValues> {
    const baseBuilder = this.client<DependencyRow, DependencyValueFilters>(
      'dependencies',
    );
    const limitedValuesBuilder = baseBuilder.clone();

    const allValuesKeys: DependencyValueFiltersKey[] = [];
    const limitedValuesKeys: DependencyValueFiltersKey[] = [];
    for (const filterKey of DependencyValueFiltersKeys) {
      const suppliedFilter = filters?.[filterKey];
      // if no filter is supplied, return all values
      if (suppliedFilter) {
        limitedValuesBuilder.whereIn(filterKey, suppliedFilter);
        limitedValuesKeys.push(filterKey);
        continue;
      }

      allValuesKeys.push(filterKey);
    }

    const result: DependencyValues = {
      datasource: [],
      manager: [],
      depType: [],
      depName: [],
      host: [],
      packageFile: [],
      repository: [],
    };

    const allValues = allValuesKeys.map(
      async (filterKey: DependencyValueFiltersKey) => {
        // get all unique values for the column and do not return as object but list
        const values = await limitedValuesBuilder
          .clone()
          .select(filterKey)
          .distinct()
          .pluck(filterKey);
        result[filterKey] = values.filter(is.string);
      },
    );
    const limitedValues = limitedValuesKeys.map(async filterKey => {
      const values = await baseBuilder
        .clone()
        .select(filterKey)
        .distinct()
        .pluck(filterKey);

      result[filterKey] = values.filter(is.string);
    });
    await Promise.all([...allValues, ...limitedValues]);
    return result;
  }

  async deleteDependencies(options: DeleteOptions): Promise<number> {
    const targets = await this.getTargets('dependencies');
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
      .andWhere('repository', repository)
      .as('runs');

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
