import { resolvePackagePath } from '@backstage/backend-common';
import { Knex } from 'knex';
import {
  Context,
  ReportQueryParameters,
  ReportsRow,
  RouterOptions,
} from './types';
import { RenovateReport, RepositoryReport } from '../schema/renovate';
import { TargetRepo } from '../wrapper/types';

const migrationsDir = resolvePackagePath(
  '@secustor/plugin-renovate-backend',
  'migrations',
);

export class DatabaseHandler {
  static async create(options: RouterOptions): Promise<DatabaseHandler> {
    const { database } = options;
    const client = await database.getClient();

    if (!database.migrations?.skip) {
      await client.migrate.latest({
        directory: migrationsDir,
      });
    }

    return new DatabaseHandler(client);
  }

  private readonly client: Knex;

  private constructor(client: Knex) {
    this.client = client;
  }

  async addReport(
    report: RenovateReport,
    { host }: TargetRepo,
    ctx: Context,
  ): Promise<void> {
    const inserts: ReportsRow[] = [];
    for (const [repository, value] of Object.entries(report.repositories)) {
      inserts.push({
        last_updated: Date.now(),
        run_id: ctx.runID,
        host,
        repository,
        report: value,
      });
    }
    this.client.batchInsert<ReportsRow>('reports', inserts);
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
