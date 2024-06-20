import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import type {
  AddReportParameters,
  DatabaseCreationParameters,
  DeleteOptions,
  ReportQueryParameters,
  ReportsRow,
  ReportTargetQuery,
} from './types';
import { LoggerService } from '@backstage/backend-plugin-api';
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

    const inserts: ReportsRow[] = [];
    for (const [repository, value] of Object.entries(report.repositories)) {
      inserts.push({
        run_id: runID,
        task_id: taskID,
        timestamp: new Date(),
        host: target.host,
        repository,
        report: value,
      });
    }
    // this.client.batchInsert<ReportsRow>('reports', inserts);
    await this.client('reports')
      .insert(inserts)
      .catch(reason => logger.error('Failed insert data', reason));
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
    let offset = 0;
    if (
      is.nullOrUndefined(options?.keepLatest) ||
      is.boolean(options?.keepLatest)
    ) {
      offset = options?.keepLatest ? 1 : 0;
    } else {
      offset = options.keepLatest;
    }
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
}
