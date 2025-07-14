import { mockServices } from '@backstage/backend-test-utils';
import { mockDeep } from 'jest-mock-extended';
import { scheduleCleanupTask } from './cleanupTask';
import { RouterOptions } from './types';
import { DatabaseHandler } from './databaseHandler';
import * as configModule from '../config';

// Mock the config module
jest.mock('../config');
const mockConfigModule = jest.mocked(configModule);

describe('scheduleCleanupTask', () => {
  let mockRouterOptions: RouterOptions;
  let mockDatabaseHandler: jest.Mocked<DatabaseHandler>;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;
  let mockScheduler: ReturnType<typeof mockServices.scheduler.mock>;
  let mockRootConfig: ReturnType<typeof mockServices.rootConfig.mock>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDatabaseHandler = mockDeep<DatabaseHandler>();
    mockLogger = mockServices.logger.mock();
    mockScheduler = mockServices.scheduler.mock();
    mockRootConfig = mockServices.rootConfig.mock();

    mockRouterOptions = {
      auth: mockServices.auth(),
      rootConfig: mockRootConfig,
      logger: mockLogger,
      databaseHandler: mockDatabaseHandler,
      runtimes: new Map(),
      queueFactories: new Map(),
      scheduler: mockScheduler,
      discovery: mockServices.discovery(),
    };

    // Default mock implementations
    mockConfigModule.getPluginConfig.mockReturnValue(mockRootConfig);
    mockConfigModule.getScheduleDefinition.mockReturnValue({
      enabled: true,
      scope: 'global',
      frequency: { minutes: 60 },
      timeout: { minutes: 60 },
    });
  });

  describe('when schedule is enabled', () => {
    beforeEach(() => {
      mockConfigModule.getScheduleDefinition.mockReturnValue({
        enabled: true,
        scope: 'global',
        frequency: { minutes: 30 },
        timeout: { minutes: 30 },
      });
    });

    it('should schedule cleanup task with default settings', async () => {
      mockRootConfig.getOptionalNumber
        .mockReturnValueOnce(undefined) // cleanup.minimumReports
        .mockReturnValueOnce(undefined); // cleanup.dependencyHistory

      await scheduleCleanupTask(mockRouterOptions);

      expect(mockConfigModule.getPluginConfig).toHaveBeenCalledWith(
        mockRootConfig,
      );
      expect(mockConfigModule.getScheduleDefinition).toHaveBeenCalledWith(
        mockRootConfig,
        'cleanup',
      );
      expect(mockScheduler.scheduleTask).toHaveBeenCalledWith({
        id: 'renovate_report_cleanup',
        enabled: true,
        scope: 'global',
        frequency: { minutes: 30 },
        timeout: { minutes: 30 },
        fn: expect.any(Function),
      });
    });

    it('should schedule cleanup task with custom settings', async () => {
      mockRootConfig.getOptionalNumber
        .mockReturnValueOnce(5) // cleanup.minimumReports
        .mockReturnValueOnce(10); // cleanup.dependencyHistory

      await scheduleCleanupTask(mockRouterOptions);

      expect(mockScheduler.scheduleTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'renovate_report_cleanup',
          enabled: true,
          fn: expect.any(Function),
        }),
      );
    });

    describe('scheduled function execution', () => {
      it('should run report cleanup when minimumReports >= 0', async () => {
        mockRootConfig.getOptionalNumber
          .mockReturnValueOnce(3) // cleanup.minimumReports
          .mockReturnValueOnce(-1); // cleanup.dependencyHistory (disabled)

        mockDatabaseHandler.deleteReports.mockResolvedValue(15);

        await scheduleCleanupTask(mockRouterOptions);

        // Get the scheduled function and execute it
        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;
        await scheduledFn(new AbortController().signal);

        expect(mockDatabaseHandler.deleteReports).toHaveBeenCalledWith({
          keepLatest: 3,
        });
        expect(mockLogger.debug).toHaveBeenCalledWith('Running report cleanup');
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Report cleanup completed. 15 reports deleted',
        );
        expect(mockDatabaseHandler.deleteDependencies).not.toHaveBeenCalled();
      });

      it('should run dependency cleanup when dependencyHistory >= 0', async () => {
        mockRootConfig.getOptionalNumber
          .mockReturnValueOnce(-1) // cleanup.minimumReports (disabled)
          .mockReturnValueOnce(7); // cleanup.dependencyHistory

        mockDatabaseHandler.deleteDependencies.mockResolvedValue(25);

        await scheduleCleanupTask(mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;
        await scheduledFn(new AbortController().signal);

        expect(mockDatabaseHandler.deleteDependencies).toHaveBeenCalledWith({
          keepLatest: 7,
        });
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Running dependency history cleanup',
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Dependency history cleanup completed. 25 dependencies deleted',
        );
        expect(mockDatabaseHandler.deleteReports).not.toHaveBeenCalled();
      });

      it('should run both cleanups when both are enabled', async () => {
        mockRootConfig.getOptionalNumber
          .mockReturnValueOnce(2) // cleanup.minimumReports
          .mockReturnValueOnce(5); // cleanup.dependencyHistory

        mockDatabaseHandler.deleteReports.mockResolvedValue(8);
        mockDatabaseHandler.deleteDependencies.mockResolvedValue(12);

        await scheduleCleanupTask(mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;
        await scheduledFn(new AbortController().signal);

        expect(mockDatabaseHandler.deleteReports).toHaveBeenCalledWith({
          keepLatest: 2,
        });
        expect(mockDatabaseHandler.deleteDependencies).toHaveBeenCalledWith({
          keepLatest: 5,
        });
        expect(mockLogger.debug).toHaveBeenCalledWith('Running report cleanup');
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Report cleanup completed. 8 reports deleted',
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Running dependency history cleanup',
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Dependency history cleanup completed. 12 dependencies deleted',
        );
      });

      it('should skip cleanup when both are disabled', async () => {
        mockRootConfig.getOptionalNumber
          .mockReturnValueOnce(-1) // cleanup.minimumReports (disabled)
          .mockReturnValueOnce(-1); // cleanup.dependencyHistory (disabled)

        await scheduleCleanupTask(mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;
        await scheduledFn(new AbortController().signal);

        expect(mockDatabaseHandler.deleteReports).not.toHaveBeenCalled();
        expect(mockDatabaseHandler.deleteDependencies).not.toHaveBeenCalled();
        expect(mockLogger.debug).not.toHaveBeenCalled();
      });

      it.each`
        reportsToKeep | dependencyHistoryKeep
        ${0}          | ${0}
        ${10}         | ${20}
      `(
        'should call both cleanup methods when enabled: reports=$reportsToKeep, dependencies=$dependencyHistoryKeep',
        async ({ reportsToKeep, dependencyHistoryKeep }) => {
          mockRootConfig.getOptionalNumber
            .mockReturnValueOnce(reportsToKeep)
            .mockReturnValueOnce(dependencyHistoryKeep);

          mockDatabaseHandler.deleteReports.mockResolvedValue(1);
          mockDatabaseHandler.deleteDependencies.mockResolvedValue(1);

          await scheduleCleanupTask(mockRouterOptions);

          const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;
          await scheduledFn(new AbortController().signal);

          expect(mockDatabaseHandler.deleteReports).toHaveBeenCalledWith({
            keepLatest: reportsToKeep,
          });
          expect(mockDatabaseHandler.deleteDependencies).toHaveBeenCalledWith({
            keepLatest: dependencyHistoryKeep,
          });
        },
      );

      it('should call only reports cleanup when dependencies cleanup disabled', async () => {
        mockRootConfig.getOptionalNumber
          .mockReturnValueOnce(0) // reports enabled
          .mockReturnValueOnce(-1); // dependencies disabled

        mockDatabaseHandler.deleteReports.mockResolvedValue(1);
        mockDatabaseHandler.deleteDependencies.mockResolvedValue(1);

        await scheduleCleanupTask(mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;
        await scheduledFn(new AbortController().signal);

        expect(mockDatabaseHandler.deleteReports).toHaveBeenCalledWith({
          keepLatest: 0,
        });
        expect(mockDatabaseHandler.deleteDependencies).not.toHaveBeenCalled();
      });

      it('should call only dependencies cleanup when reports cleanup disabled', async () => {
        mockRootConfig.getOptionalNumber
          .mockReturnValueOnce(-1) // reports disabled
          .mockReturnValueOnce(0); // dependencies enabled

        mockDatabaseHandler.deleteReports.mockResolvedValue(1);
        mockDatabaseHandler.deleteDependencies.mockResolvedValue(1);

        await scheduleCleanupTask(mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;
        await scheduledFn(new AbortController().signal);

        expect(mockDatabaseHandler.deleteReports).not.toHaveBeenCalled();
        expect(mockDatabaseHandler.deleteDependencies).toHaveBeenCalledWith({
          keepLatest: 0,
        });
      });
    });
  });

  describe('when schedule is disabled', () => {
    beforeEach(() => {
      mockConfigModule.getScheduleDefinition.mockReturnValue({
        enabled: false,
        scope: 'global',
        frequency: { minutes: 60 },
        timeout: { minutes: 60 },
      });
    });

    it('should return resolved promise without scheduling', async () => {
      const result = await scheduleCleanupTask(mockRouterOptions);

      expect(result).toBeUndefined();
      expect(mockScheduler.scheduleTask).not.toHaveBeenCalled();
      expect(mockConfigModule.getPluginConfig).toHaveBeenCalledWith(
        mockRootConfig,
      );
      expect(mockConfigModule.getScheduleDefinition).toHaveBeenCalledWith(
        mockRootConfig,
        'cleanup',
      );
    });
  });

  describe('error handling', () => {
    it('should propagate database errors during report cleanup', async () => {
      mockRootConfig.getOptionalNumber
        .mockReturnValueOnce(1) // cleanup.minimumReports
        .mockReturnValueOnce(-1); // cleanup.dependencyHistory (disabled)

      const error = new Error('Database connection failed');
      mockDatabaseHandler.deleteReports.mockRejectedValue(error);

      await scheduleCleanupTask(mockRouterOptions);

      const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;

      await expect(scheduledFn(new AbortController().signal)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should propagate database errors during dependency cleanup', async () => {
      mockRootConfig.getOptionalNumber
        .mockReturnValueOnce(-1) // cleanup.minimumReports (disabled)
        .mockReturnValueOnce(1); // cleanup.dependencyHistory

      const error = new Error('Database cleanup failed');
      mockDatabaseHandler.deleteDependencies.mockRejectedValue(error);

      await scheduleCleanupTask(mockRouterOptions);

      const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;

      await expect(scheduledFn(new AbortController().signal)).rejects.toThrow(
        'Database cleanup failed',
      );
    });
  });
});
