import { mockServices } from '@backstage/backend-test-utils';
import { mockDeep } from 'jest-mock-extended';
import { Knex } from 'knex';
import { DatabaseHandler } from './databaseHandler';
import {
  DatabaseCreationParameters,
  AddReportParameters,
  ReportQueryParameters,
  DependenciesFilter,
  PaginationOptions,
  DependencyValueFilters,
  DeleteOptions,
  ReportTargetQuery,
} from './types';
import {
  RenovateReport,
  TargetRepo,
  RepositoryReport,
} from '@secustor/backstage-plugin-renovate-common';

// Create a proper mock for Knex client that can be called as a function
const mockKnexClient = jest.fn() as jest.MockedFunction<Knex> & {
  migrate: { latest: jest.MockedFunction<any> };
  select: jest.MockedFunction<any>;
};

// Add properties to the mock function
mockKnexClient.migrate = { latest: jest.fn() };
mockKnexClient.select = jest.fn();

const mockDatabase = mockServices.database.mock();
const mockLogger = mockServices.logger.mock();

// Mock migration helper
jest.mock('@backstage/backend-plugin-api', () => ({
  ...jest.requireActual('@backstage/backend-plugin-api'),
  resolvePackagePath: jest.fn().mockReturnValue('/mocked/migrations/path'),
}));

describe('DatabaseHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockDatabase.getClient.mockResolvedValue(mockKnexClient);
    mockKnexClient.migrate.latest.mockResolvedValue([]);

    // Setup Knex client to be callable as function and return query builder
    mockKnexClient.mockImplementation(
      () =>
        ({
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnValue({
            catch: jest.fn().mockResolvedValue(undefined),
          }),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          offset: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          count: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
          from: jest.fn().mockResolvedValue([]),
          distinct: jest.fn().mockReturnThis(),
          clone: jest.fn().mockReturnThis(),
          pluck: jest.fn().mockResolvedValue([]),
          whereIn: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
        }) as any,
    );
  });

  describe('create', () => {
    it('should create DatabaseHandler with migrations', async () => {
      const options: DatabaseCreationParameters = {
        database: mockDatabase,
        logger: mockLogger,
      };

      const handler = await DatabaseHandler.create(options);

      expect(mockDatabase.getClient).toHaveBeenCalled();
      expect(mockKnexClient.migrate.latest).toHaveBeenCalledWith({
        directory: '/mocked/migrations/path',
      });
      expect(handler).toBeInstanceOf(DatabaseHandler);
    });

    it('should skip migrations when configured', async () => {
      mockDatabase.migrations = { skip: true };
      const options: DatabaseCreationParameters = {
        database: mockDatabase,
        logger: mockLogger,
      };

      await DatabaseHandler.create(options);

      expect(mockKnexClient.migrate.latest).not.toHaveBeenCalled();
    });
  });

  describe('addReport', () => {
    let handler: DatabaseHandler;
    const mockTimestamp = new Date('2024-01-01T00:00:00.000Z');

    beforeEach(async () => {
      jest.spyOn(global, 'Date').mockImplementation(() => mockTimestamp);
      handler = await DatabaseHandler.create({
        database: mockDatabase,
        logger: mockLogger,
      });

      // Mock updateDependencies (private method called within addReport)
      jest
        .spyOn(handler as any, 'updateDependencies')
        .mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should add report successfully', async () => {
      const report: RenovateReport = {
        repositories: {
          'test/repo': {
            branches: [],
            packageFiles: {},
            problems: [],
          } as RepositoryReport,
        },
      };

      const target: TargetRepo = {
        host: 'github.com',
        repository: 'test/repo',
      };

      const options: AddReportParameters = {
        runID: 'run-123',
        taskID: 'task-456',
        report,
        target,
      };

      await handler.addReport(options);

      expect(mockKnexClient).toHaveBeenCalledWith('reports');
      expect(handler.updateDependencies).toHaveBeenCalledWith(
        mockTimestamp,
        options,
      );
    });

    it('should handle insert errors gracefully', async () => {
      // Override the default mock to simulate error
      mockKnexClient.mockImplementation(
        () =>
          ({
            insert: jest.fn().mockReturnValue({
              catch: jest.fn().mockImplementation(callback => {
                callback(new Error('Insert failed'));
                return Promise.resolve();
              }),
            }),
          }) as any,
      );

      const report: RenovateReport = {
        repositories: {
          'test/repo': {
            branches: [],
            packageFiles: {},
            problems: [],
          } as RepositoryReport,
        },
      };

      const options: AddReportParameters = {
        runID: 'run-123',
        taskID: 'task-456',
        report,
        target: { host: 'github.com', repository: 'test/repo' },
      };

      await handler.addReport(options);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed insert data',
        expect.any(Error),
      );
    });
  });

  describe('getReports', () => {
    let handler: DatabaseHandler;

    beforeEach(async () => {
      handler = await DatabaseHandler.create({
        database: mockDatabase,
        logger: mockLogger,
      });
    });

    it('should get reports without query', async () => {
      const mockRows = [
        {
          run_id: 'run-123',
          task_id: 'task-456',
          timestamp: new Date('2024-01-01'),
          host: 'github.com',
          repository: 'test/repo',
          report: { branches: [], packageFiles: {}, problems: [] },
        },
      ];

      const mockBuilder = {
        from: jest.fn().mockResolvedValue(mockRows),
      };
      mockKnexClient.select.mockReturnValue(mockBuilder as any);

      const result = await handler.getReports();

      expect(mockKnexClient.select).toHaveBeenCalled();
      expect(mockBuilder.from).toHaveBeenCalledWith('reports');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        runID: 'run-123',
        taskID: 'task-456',
        host: 'github.com',
        repository: 'test/repo',
      });
    });

    it('should get reports with query parameters', async () => {
      const query: ReportQueryParameters = {
        host: 'github.com',
        repository: 'test/repo',
      };

      const mockBuilder = {
        where: jest.fn().mockReturnThis(),
        from: jest.fn().mockResolvedValue([]),
      };
      mockKnexClient.select.mockReturnValue(mockBuilder as any);

      await handler.getReports(query);

      expect(mockBuilder.where).toHaveBeenCalledWith(query);
    });

    it('should parse JSON string report field', async () => {
      const mockRows = [
        {
          run_id: 'run-123',
          task_id: 'task-456',
          timestamp: new Date('2024-01-01'),
          host: 'github.com',
          repository: 'test/repo',
          report: '{"branches":[],"packageFiles":{},"problems":[]}',
        },
      ];

      const mockBuilder = {
        from: jest.fn().mockResolvedValue(mockRows),
      };
      mockKnexClient.select.mockReturnValue(mockBuilder as any);

      const result = await handler.getReports();

      expect(result[0].report).toEqual({
        branches: [],
        packageFiles: {},
        problems: [],
      });
    });
  });

  describe('getTargets', () => {
    let handler: DatabaseHandler;

    beforeEach(async () => {
      handler = await DatabaseHandler.create({
        database: mockDatabase,
        logger: mockLogger,
      });
    });

    it.each`
      table             | expected
      ${'reports'}      | ${'reports'}
      ${'dependencies'} | ${'dependencies'}
      ${undefined}      | ${'reports'}
    `('should get targets from $table table', async ({ table, expected }) => {
      const mockTargets = [
        { host: 'github.com', repository: 'test/repo1' },
        { host: 'gitlab.com', repository: 'test/repo2' },
      ];

      const mockBuilder = {
        distinct: jest.fn().mockReturnThis(),
        from: jest.fn().mockResolvedValue(mockTargets),
      };
      mockKnexClient.select.mockReturnValue(mockBuilder as any);

      const result = await handler.getTargets(table);

      expect(mockKnexClient.select).toHaveBeenCalled();
      expect(mockBuilder.distinct).toHaveBeenCalledWith('host', 'repository');
      expect(mockBuilder.from).toHaveBeenCalledWith(expected);
      expect(result).toEqual(mockTargets);
    });
  });

  describe('deleteReportsByTarget', () => {
    let handler: DatabaseHandler;

    beforeEach(async () => {
      handler = await DatabaseHandler.create({
        database: mockDatabase,
        logger: mockLogger,
      });
    });

    it('should delete reports by target with default options', async () => {
      const target: ReportTargetQuery = {
        host: 'github.com',
        repository: 'test/repo',
      };

      // Override the default mock for this specific test
      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockResolvedValue(5),
      };

      mockKnexClient.mockImplementation(() => mockBuilder as any);

      const result = await handler.deleteReportsByTarget(target);

      expect(mockBuilder.where).toHaveBeenCalledWith('host', 'github.com');
      expect(mockBuilder.andWhere).toHaveBeenCalledWith(
        'repository',
        'test/repo',
      );
      expect(mockBuilder.offset).toHaveBeenCalledWith(0);
      expect(result).toBe(5);
    });

    it('should delete reports with keepLatest option', async () => {
      const target: ReportTargetQuery = {
        host: 'github.com',
        repository: 'test/repo',
      };
      const options: DeleteOptions = { keepLatest: true };

      // Override the default mock for this specific test
      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockResolvedValue(3),
      };

      mockKnexClient.mockImplementation(() => mockBuilder as any);

      const result = await handler.deleteReportsByTarget(target, options);

      expect(mockBuilder.offset).toHaveBeenCalledWith(1);
      expect(result).toBe(3);
    });
  });

  describe('getDependencies', () => {
    let handler: DatabaseHandler;

    beforeEach(async () => {
      handler = await DatabaseHandler.create({
        database: mockDatabase,
        logger: mockLogger,
      });
    });

    it('should get dependencies with filters and pagination', async () => {
      const filters: DependenciesFilter = {
        host: ['github.com'],
        manager: ['npm'],
        latestOnly: true,
      };
      const pagination: Partial<PaginationOptions> = {
        page: 1,
        pageSize: 100,
      };

      const mockDependencies = [
        {
          id: '1',
          run_id: 'run-123',
          host: 'github.com',
          repository: 'test/repo',
          manager: 'npm',
          depName: 'lodash',
        },
      ];

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDependencies),
      };

      mockKnexClient.mockImplementation(() => mockBuilder as any);

      // Mock getDependenciesCount
      jest.spyOn(handler, 'getDependenciesCount').mockResolvedValue(150);
      jest
        .spyOn(handler as any, 'applyDependencyFilters')
        .mockImplementation(() => {});

      const result = await handler.getDependencies(filters, pagination);

      expect(result).toMatchObject({
        result: mockDependencies,
        total: 150,
        page: 1,
        pageSize: 100,
        pageCount: 2,
      });
      expect(mockBuilder.offset).toHaveBeenCalledWith(100);
      expect(mockBuilder.limit).toHaveBeenCalledWith(100);
    });

    it('should use default pagination values', async () => {
      const filters: DependenciesFilter = {};

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      mockKnexClient.mockImplementation(() => mockBuilder as any);
      jest.spyOn(handler, 'getDependenciesCount').mockResolvedValue(0);
      jest
        .spyOn(handler as any, 'applyDependencyFilters')
        .mockImplementation(() => {});

      const result = await handler.getDependencies(filters);

      expect(result.page).toBe(0);
      expect(result.pageSize).toBe(500);
      expect(mockBuilder.offset).toHaveBeenCalledWith(0);
      expect(mockBuilder.limit).toHaveBeenCalledWith(500);
    });
  });

  describe('getDependenciesCount', () => {
    let handler: DatabaseHandler;

    beforeEach(async () => {
      handler = await DatabaseHandler.create({
        database: mockDatabase,
        logger: mockLogger,
      });
    });

    it('should get dependencies count as number', async () => {
      const filters: DependenciesFilter = { host: ['github.com'] };

      const mockBuilder = {
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ count: 42 }),
      };

      mockKnexClient.mockImplementation(() => mockBuilder as any);
      jest
        .spyOn(handler as any, 'applyDependencyFilters')
        .mockImplementation(() => {});

      const result = await handler.getDependenciesCount(filters);

      expect(mockBuilder.count).toHaveBeenCalledWith({ count: '*' });
      expect(result).toBe(42);
    });

    it('should parse string count to number', async () => {
      const filters: DependenciesFilter = {};

      const mockBuilder = {
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ count: '25' }),
      };

      mockKnexClient.mockImplementation(() => mockBuilder as any);
      jest
        .spyOn(handler as any, 'applyDependencyFilters')
        .mockImplementation(() => {});

      const result = await handler.getDependenciesCount(filters);

      expect(result).toBe(25);
    });

    it('should return 0 for null count', async () => {
      const filters: DependenciesFilter = {};

      const mockBuilder = {
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      };

      mockKnexClient.mockImplementation(() => mockBuilder as any);
      jest
        .spyOn(handler as any, 'applyDependencyFilters')
        .mockImplementation(() => {});

      const result = await handler.getDependenciesCount(filters);

      expect(result).toBe(0);
    });
  });

  describe('getDependenciesValues', () => {
    let handler: DatabaseHandler;

    beforeEach(async () => {
      handler = await DatabaseHandler.create({
        database: mockDatabase,
        logger: mockLogger,
      });
    });

    it('should get all dependency values when no filters supplied', async () => {
      const mockValues = ['npm', 'yarn'];

      const mockBuilder = {
        clone: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        pluck: jest.fn().mockResolvedValue(mockValues),
        whereIn: jest.fn().mockReturnThis(),
      };

      mockKnexClient.mockImplementation(() => mockBuilder as any);

      const result = await handler.getDependenciesValues();

      expect(result).toMatchObject({
        datasource: mockValues,
        manager: mockValues,
        depType: mockValues,
        depName: mockValues,
        host: mockValues,
        packageFile: mockValues,
        repository: mockValues,
      });
    });

    it('should apply filters for limited values', async () => {
      const filters: DependencyValueFilters = {
        host: ['github.com'],
        manager: ['npm'],
      };

      const mockLimitedBuilder = {
        clone: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        pluck: jest.fn().mockResolvedValue(['filtered-value']),
        whereIn: jest.fn().mockReturnThis(),
      };

      const mockBaseBuilder = {
        clone: jest.fn().mockReturnValue(mockLimitedBuilder),
        select: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        pluck: jest.fn().mockResolvedValue(['all-values']),
      };

      mockKnexClient.mockImplementation(() => mockBaseBuilder as any);

      const result = await handler.getDependenciesValues(filters);

      expect(mockLimitedBuilder.whereIn).toHaveBeenCalledWith('host', [
        'github.com',
      ]);
      expect(mockLimitedBuilder.whereIn).toHaveBeenCalledWith('manager', [
        'npm',
      ]);
      expect(result.host).toEqual(['filtered-value']);
      expect(result.manager).toEqual(['filtered-value']);
    });
  });
});
