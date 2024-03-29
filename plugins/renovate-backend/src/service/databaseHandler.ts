import { resolvePackagePath } from '@backstage/backend-common';
import { Knex } from 'knex';
import {
  AddReportParameters,
  DatabaseCreationParameters,
  ReportQueryParameters,
  ReportsRow,
} from './types';
import { RepositoryReport } from '../schema/renovate';
import { LoggerService } from '@backstage/backend-plugin-api';

const migrationsDir = resolvePackagePath(
  '@secustor/plugin-renovate-backend',
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

  private constructor(private client: Knex, private logger: LoggerService) {}

  async addReport(options: AddReportParameters): Promise<void> {
    const { taskID, report, target } = options;
    const logger = options.logger ?? this.logger;

    const inserts: ReportsRow[] = [];
    for (const [repository, value] of Object.entries(report.repositories)) {
      inserts.push({
        task_id: taskID,
        last_updated: Date.now(),
        host: target.host,
        repository,
        report: value,
      });
    }
    // this.client.batchInsert<ReportsRow>('reports', inserts);
    await this.client('reports')
      .insert(inserts)
      .onConflict('task_id')
      .merge()
      .catch(reason => logger.error('Failed insert data', reason));
  }

  async getReports(query?: ReportQueryParameters): Promise<RepositoryReport[]> {
    const builder = this.client.select<ReportsRow[]>();
    if (query) {
      builder.where(query);
    }
    const rows = await builder.from('reports');
    return rows.map(row => row.report);
  }
}
