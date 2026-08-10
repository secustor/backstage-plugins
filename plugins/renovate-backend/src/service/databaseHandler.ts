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

    // SQLite has a limit on variables per query (typically 999-32766)
    // With 16 columns per row, batch size of 50 is safe for all SQLite versions
    await this.client.batchInsert('dependencies', dependencies, 50);
  }

  async getDependencies(
    filters: DependenciesFilter,
    pagination?: Partial<PaginationOptions>,
  ): Promise<Pagination<DependencyRow[]>> {
    const page = pagination?.page ?? 0;
    const pageSize = pagination?.pageSize ?? 500;
    const offset = page * pageSize;

    // Build subquery with filters
    const filteredQuery = this.client('dependencies').select('*');
    this.applyDependencyFilters(filteredQuery, filters);

    // Use window function for total count in single query
    const results = await this.client
      .select('*')
      .select(this.client.raw('COUNT(*) OVER() as total_count'))
      .from<
        DependencyRow & { total_count: string | number }
      >(filteredQuery.as('filtered'))
      .offset(offset)
      .limit(pageSize);

    const total = results.length > 0 ? Number(results[0].total_count) : 0;

    // Remove total_count from results - properly typed
    const cleanResults: DependencyRow[] = results.map(
      ({ total_count, ...row }) => row,
    );

    return {
      result: cleanResults,
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
      const rankedSubquery = this.client
        .select('run_id')
        .select(
          this.client.raw(
            'ROW_NUMBER() OVER (PARTITION BY host, repository ORDER BY "extractionTimestamp" DESC) as rn',
          ),
        )
        .from('dependencies')
        .as('ranked');

      const latestRunIds = this.client
        .select('run_id')
        .from(rankedSubquery)
        .where('rn', 1);

      builder.whereIn('run_id', latestRunIds);
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
    // Build base builder with filters applied
    const baseBuilder = this.client('dependencies');

    // Apply filters to create the filtered dataset
    const filteredKeys: DependencyValueFiltersKey[] = [];
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (
          value &&
          DependencyValueFiltersKeys.includes(key as DependencyValueFiltersKey)
        ) {
          baseBuilder.whereIn(key, value);
          filteredKeys.push(key as DependencyValueFiltersKey);
        }
      }
    }

    // Use UNION ALL to get all distinct values in one roundtrip
    // For each column, we need the values from either filtered or unfiltered dataset
    const queries = DependencyValueFiltersKeys.map(key => {
      const builder = filteredKeys.includes(key)
        ? this.client('dependencies') // unfiltered for this column
        : baseBuilder.clone(); // filtered for other columns

      return builder
        .select(this.client.raw('? as column_name', [key]))
        .select(this.client.raw(`?? as value`, [key]))
        .distinct();
    });

    // Combine all queries
    const combinedQuery = queries.reduce((acc, q, i) =>
      i === 0 ? q : acc.unionAll(q),
    );

    const rows = await combinedQuery;

    // Group results by column name
    const result: DependencyValues = {
      datasource: [],
      manager: [],
      depType: [],
      depName: [],
      host: [],
      packageFile: [],
      repository: [],
    };

    for (const row of rows) {
      if (row.value && is.string(row.value)) {
        result[row.column_name as DependencyValueFiltersKey].push(row.value);
      }
    }

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

    // Get ordered run_ids - must include extractionTimestamp for ORDER BY with DISTINCT
    const orderedRuns = this.client('dependencies')
      .select('run_id', 'extractionTimestamp')
      .where('host', host)
      .andWhere('repository', repository)
      .orderBy('extractionTimestamp', 'DESC')
      .offset(offset)
      .distinct()
      .as('ordered');

    const toBeDeletedIDs = this.client.select('run_id').from(orderedRuns);

    return this.client('dependencies')
      .delete()
      .whereIn('run_id', toBeDeletedIDs);
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
