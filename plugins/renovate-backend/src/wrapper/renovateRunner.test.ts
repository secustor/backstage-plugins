import { mockServices } from '@backstage/backend-test-utils';
import { mockDeep } from 'jest-mock-extended';
import { Readable } from 'stream';
import { RenovateRunner } from './renovateRunner';
import { RouterOptions } from '../service/types';
import { DatabaseHandler } from '../service/databaseHandler';
import {
  QueueFactory,
  RenovateQueue,
  RunOptions,
  AddResult,
} from '@secustor/backstage-plugin-renovate-node';
import {
  RenovateWrapper,
  TargetRepo,
  RenovateReport,
  getTaskID,
  getTargetRepo,
} from '@secustor/backstage-plugin-renovate-common';
import { Entity } from '@backstage/catalog-model';
import * as configModule from '../config';
import * as utilsModule from './utils';
import * as platformsModule from './platforms';
import * as queueModule from '../queue';

// Mock external modules
jest.mock('../config');
jest.mock('./utils');
jest.mock('./platforms');
jest.mock('../queue');
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-run-id'),
}));

const mockConfigModule = jest.mocked(configModule);
const mockUtilsModule = jest.mocked(utilsModule);
const mockPlatformsModule = jest.mocked(platformsModule);
const mockQueueModule = jest.mocked(queueModule);

// Mock common functions
jest.mock('@secustor/backstage-plugin-renovate-common', () => ({
  ...jest.requireActual('@secustor/backstage-plugin-renovate-common'),
  getTaskID: jest.fn(),
  getTargetRepo: jest.fn(),
}));

const mockGetTaskID = jest.mocked(getTaskID);
const mockGetTargetRepo = jest.mocked(getTargetRepo);

describe('RenovateRunner', () => {
  let mockDatabaseHandler: jest.Mocked<DatabaseHandler>;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;
  let mockRootConfig: ReturnType<typeof mockServices.rootConfig.mock>;
  let mockQueueFactory: jest.MockedFunction<QueueFactory<RunOptions>>;
  let mockQueue: jest.Mocked<RenovateQueue<RunOptions>>;
  let mockRenovateWrapper: jest.Mocked<RenovateWrapper>;
  let mockChildLogger: ReturnType<typeof mockServices.logger.mock>;

  const mockTarget: TargetRepo = {
    host: 'github.com',
    repository: 'test/repo',
  };

  const mockEntity: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-service',
      annotations: {
        'backstage.io/source-location': 'url:https://github.com/test/repo',
      },
    },
    spec: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDatabaseHandler = mockDeep<DatabaseHandler>();
    mockLogger = mockServices.logger.mock();
    mockChildLogger = mockServices.logger.mock();
    mockRootConfig = mockServices.rootConfig.mock();
    mockQueueFactory = jest.fn();
    mockQueue = mockDeep<RenovateQueue<RunOptions>>();
    mockRenovateWrapper = mockDeep<RenovateWrapper>();

    // Setup common mocks
    mockLogger.child.mockReturnValue(mockChildLogger);
    mockQueueFactory.mockReturnValue(mockQueue);
    mockQueueModule.createQueue.mockReturnValue(mockQueue);
    mockGetTaskID.mockReturnValue('test-task-id');
    mockGetTargetRepo.mockReturnValue(mockTarget);

    // Default config mocks
    mockConfigModule.getRuntimeConfigs.mockReturnValue({
      runtime: 'direct',
      config: mockRootConfig,
      environment: [],
    });
    mockConfigModule.getRenovateConfig.mockReturnValue({ config: 'test' });

    // Default utils mocks
    mockPlatformsModule.getPlatformEnvs.mockResolvedValue({
      RENOVATE_PLATFORM: 'github',
      RENOVATE_ENDPOINT: 'https://api.github.com/',
    });
    mockUtilsModule.getCacheEnvs.mockReturnValue({
      RENOVATE_CACHE_DIR: '/tmp/cache',
    });
    mockUtilsModule.getPassthroughEnvs.mockReturnValue({
      NODE_ENV: 'test',
    });
    mockUtilsModule.extractReport.mockResolvedValue({
      repositories: {},
    });
  });

  describe('constructor', () => {
    it('should create RenovateRunner instance', () => {
      const queueFactories = new Map([['local', mockQueueFactory]]);
      const runtimes = new Map([['direct', mockRenovateWrapper]]);

      const runner = new RenovateRunner(
        queueFactories,
        mockDatabaseHandler,
        mockRootConfig,
        mockLogger,
        runtimes,
      );

      expect(runner).toBeInstanceOf(RenovateRunner);
      expect(runner.logger).toBe(mockLogger);
      expect(mockQueueModule.createQueue).toHaveBeenCalledWith(
        queueFactories,
        mockRootConfig,
        runner,
      );
    });
  });

  describe('from', () => {
    it('should create RenovateRunner from RouterOptions', async () => {
      const routerOptions: RouterOptions = {
        auth: mockServices.auth(),
        rootConfig: mockRootConfig,
        logger: mockLogger,
        databaseHandler: mockDatabaseHandler,
        runtimes: new Map([['direct', mockRenovateWrapper]]),
        queueFactories: new Map([['local', mockQueueFactory]]),
        scheduler: mockServices.scheduler.mock(),
        discovery: mockServices.discovery(),
      };

      const runner = await RenovateRunner.from(routerOptions);

      expect(runner).toBeInstanceOf(RenovateRunner);
      expect(runner.logger).toBe(mockLogger);
    });
  });

  describe('addToQueue', () => {
    let runner: RenovateRunner;

    beforeEach(() => {
      runner = new RenovateRunner(
        new Map([['local', mockQueueFactory]]),
        mockDatabaseHandler,
        mockRootConfig,
        mockLogger,
        new Map([['direct', mockRenovateWrapper]]),
      );
    });

    it('should add single target to queue', async () => {
      const mockAddResult: AddResult = {
        status: 'queued',
        id: 'test-task-id',
      };
      mockQueue.addBulk.mockResolvedValue([mockAddResult]);

      const result = await runner.addToQueue(mockTarget);

      expect(mockGetTaskID).toHaveBeenCalledWith(mockTarget);
      expect(mockGetTargetRepo).toHaveBeenCalledWith(mockTarget);
      expect(mockQueue.addBulk).toHaveBeenCalledWith([
        {
          jobId: 'test-task-id',
          data: {
            id: 'test-task-id',
            target: mockTarget,
          },
        },
      ]);
      expect(result).toEqual([mockAddResult]);
    });

    it('should add multiple targets to queue', async () => {
      const mockAddResults: AddResult[] = [
        { status: 'queued', id: 'test-task-id-1' },
        { status: 'queued', id: 'test-task-id-2' },
      ];
      mockGetTaskID
        .mockReturnValueOnce('test-task-id-1')
        .mockReturnValueOnce('test-task-id-2');
      mockQueue.addBulk.mockResolvedValue(mockAddResults);

      const result = await runner.addToQueue(mockTarget, mockEntity);

      expect(mockGetTaskID).toHaveBeenCalledTimes(2);
      expect(mockGetTargetRepo).toHaveBeenCalledTimes(2);
      expect(mockQueue.addBulk).toHaveBeenCalledWith([
        {
          jobId: 'test-task-id-1',
          data: { id: 'test-task-id-1', target: mockTarget },
        },
        {
          jobId: 'test-task-id-2',
          data: { id: 'test-task-id-2', target: mockTarget },
        },
      ]);
      expect(result).toEqual(mockAddResults);
    });

    it('should handle string targets', async () => {
      const stringTarget = 'github.com/test/repo';
      const mockAddResult: AddResult = {
        status: 'queued',
        jobId: 'string-task-id',
      };
      mockGetTaskID.mockReturnValue('string-task-id');
      mockQueue.addBulk.mockResolvedValue([mockAddResult]);

      const result = await runner.addToQueue(stringTarget);

      expect(mockGetTaskID).toHaveBeenCalledWith(stringTarget);
      expect(mockGetTargetRepo).toHaveBeenCalledWith(stringTarget);
      expect(result).toEqual([mockAddResult]);
    });

    it('should handle empty targets array', async () => {
      mockQueue.addBulk.mockResolvedValue([]);

      const result = await runner.addToQueue();

      expect(mockQueue.addBulk).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe('runNext', () => {
    let runner: RenovateRunner;

    beforeEach(() => {
      runner = new RenovateRunner(
        new Map([['local', mockQueueFactory]]),
        mockDatabaseHandler,
        mockRootConfig,
        mockLogger,
        new Map([['direct', mockRenovateWrapper]]),
      );
    });

    it('should add job to front of queue with force option', async () => {
      const mockAddResult: AddResult = {
        status: 'queued',
        id: 'test-task-id',
      };
      mockQueue.add.mockResolvedValue(mockAddResult);

      const result = await runner.runNext(mockTarget);

      expect(mockGetTaskID).toHaveBeenCalledWith(mockTarget);
      expect(mockGetTargetRepo).toHaveBeenCalledWith(mockTarget);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'test-task-id',
        { id: 'test-task-id', target: mockTarget },
        { force: true, insertInFront: true },
      );
      expect(result).toEqual(mockAddResult);
    });
  });

  describe('run', () => {
    let runner: RenovateRunner;

    beforeEach(() => {
      runner = new RenovateRunner(
        new Map([['local', mockQueueFactory]]),
        mockDatabaseHandler,
        mockRootConfig,
        mockLogger,
        new Map([['direct', mockRenovateWrapper]]),
      );
    });

    it('should run renovate successfully and store report', async () => {
      const runOptions: RunOptions = {
        id: 'test-job-id',
        target: mockTarget,
      };
      const mockReport: RenovateReport = {
        problems: [],
        repositories: {
          'test/repo': {
            branches: [],
            packageFiles: {},
            problems: [],
          },
        },
      };

      jest.spyOn(runner, 'renovate').mockResolvedValue(mockReport);

      await runner.run(runOptions);

      expect(mockLogger.child).toHaveBeenCalledWith({
        runID: 'mock-run-id',
        jobID: 'test-job-id',
        host: 'github.com',
        repository: 'test/repo',
      });
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        'Renovate run starting',
      );
      expect(runner.renovate).toHaveBeenCalledWith(runOptions, mockChildLogger);
      expect(mockDatabaseHandler.addReport).toHaveBeenCalledWith({
        runID: 'mock-run-id',
        taskID: 'test-job-id',
        report: mockReport,
        target: mockTarget,
        logger: mockChildLogger,
      });
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        'Renovate run successfully finished',
      );
    });

    it('should handle renovate errors gracefully', async () => {
      const runOptions: RunOptions = {
        id: 'test-job-id',
        target: mockTarget,
      };
      const error = new Error('Renovate failed');

      jest.spyOn(runner, 'renovate').mockRejectedValue(error);

      await runner.run(runOptions);

      expect(mockChildLogger.error).toHaveBeenCalledWith(
        'Renovate failed',
        error,
      );
      expect(mockDatabaseHandler.addReport).not.toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', async () => {
      const runOptions: RunOptions = {
        id: 'test-job-id',
        target: mockTarget,
      };
      const nonError = 'String error';

      jest.spyOn(runner, 'renovate').mockRejectedValue(nonError);

      await runner.run(runOptions);

      expect(mockChildLogger.error).toHaveBeenCalledWith('Renovate failed', {});
    });
  });

  describe('renovate', () => {
    let runner: RenovateRunner;

    beforeEach(() => {
      runner = new RenovateRunner(
        new Map([['local', mockQueueFactory]]),
        mockDatabaseHandler,
        mockRootConfig,
        mockLogger,
        new Map([['direct', mockRenovateWrapper]]),
      );
    });

    it('should run renovate with correct configuration', async () => {
      const runOptions: RunOptions = {
        id: 'test-job-id',
        target: mockTarget,
      };
      const mockStdout = Readable.from(['mock stdout']);
      const mockRuntimeResult = {
        stdout: mockStdout,
        stderr: Readable.from(['mock stderr']),
      };
      const mockReport: RenovateReport = { problems: [], repositories: {} };

      mockRenovateWrapper.run.mockResolvedValue(mockRuntimeResult);
      mockUtilsModule.extractReport.mockResolvedValue(mockReport);

      const result = await runner.renovate(runOptions, mockChildLogger);

      expect(mockConfigModule.getRuntimeConfigs).toHaveBeenCalledWith(
        mockRootConfig,
      );
      expect(mockPlatformsModule.getPlatformEnvs).toHaveBeenCalledWith(
        mockTarget,
        {
          logger: mockChildLogger,
          rootConfig: mockRootConfig,
        },
      );
      expect(mockUtilsModule.getCacheEnvs).toHaveBeenCalledWith(
        mockRootConfig,
        mockChildLogger,
      );
      expect(mockUtilsModule.getPassthroughEnvs).toHaveBeenCalledWith(
        mockRootConfig,
        mockChildLogger,
      );
      expect(mockConfigModule.getRenovateConfig).toHaveBeenCalledWith(
        mockRootConfig,
      );

      expect(mockRenovateWrapper.run).toHaveBeenCalledWith({
        runID: 'test-job-id',
        env: {
          LOG_FORMAT: 'json',
          LOG_LEVEL: 'debug',
          LOG_CONTEXT: 'test-job-id',
          RENOVATE_REPORT_TYPE: 'logging',
          RENOVATE_PLATFORM: 'github',
          RENOVATE_ENDPOINT: 'https://api.github.com/',
          RENOVATE_CACHE_DIR: '/tmp/cache',
          NODE_ENV: 'test',
        },
        renovateConfig: { config: 'test' },
        runtimeConfig: mockRootConfig,
        logger: mockChildLogger,
      });

      expect(mockUtilsModule.extractReport).toHaveBeenCalledWith({
        logger: mockChildLogger,
        logStream: mockStdout,
      });
      expect(result).toEqual(mockReport);
    });

    it('should throw error for unknown runtime', async () => {
      mockConfigModule.getRuntimeConfigs.mockReturnValue({
        runtime: 'unknown-runtime',
        config: mockRootConfig,
        environment: [],
      });

      const runOptions: RunOptions = {
        id: 'test-job-id',
        target: mockTarget,
      };

      await expect(
        runner.renovate(runOptions, mockChildLogger),
      ).rejects.toThrow("Unknown runtime type 'unknown-runtime'");
    });

    it('should handle runtime execution errors', async () => {
      const runOptions: RunOptions = {
        id: 'test-job-id',
        target: mockTarget,
      };
      const error = new Error('Runtime execution failed');

      mockRenovateWrapper.run.mockRejectedValue(error);

      await expect(
        runner.renovate(runOptions, mockChildLogger),
      ).rejects.toThrow('Runtime execution failed');
    });

    it('should handle report extraction errors', async () => {
      const runOptions: RunOptions = {
        id: 'test-job-id',
        target: mockTarget,
      };
      const mockRuntimeResult = {
        stdout: Readable.from(['invalid stdout']),
        stderr: Readable.from(['mock stderr']),
      };
      const error = new Error('Failed to extract report');

      mockRenovateWrapper.run.mockResolvedValue(mockRuntimeResult);
      mockUtilsModule.extractReport.mockRejectedValue(error);

      await expect(
        runner.renovate(runOptions, mockChildLogger),
      ).rejects.toThrow('Failed to extract report');
    });

    it('should merge environment variables correctly', async () => {
      const runOptions: RunOptions = {
        id: 'test-job-id',
        target: mockTarget,
      };

      mockPlatformsModule.getPlatformEnvs.mockResolvedValue({
        RENOVATE_PLATFORM: 'gitlab',
        RENOVATE_ENDPOINT: 'https://gitlab.com/api/v4',
      });
      mockUtilsModule.getCacheEnvs.mockReturnValue({
        RENOVATE_CACHE_DIR: '/custom/cache',
        REDIS_URL: 'redis://localhost:6379',
      });
      mockUtilsModule.getPassthroughEnvs.mockReturnValue({
        HTTP_PROXY: 'http://proxy:8080',
        NODE_ENV: 'production',
      });

      mockRenovateWrapper.run.mockResolvedValue({
        stdout: Readable.from(['mock stdout']),
        stderr: Readable.from(['mock stderr']),
      });

      await runner.renovate(runOptions, mockChildLogger);

      expect(mockRenovateWrapper.run).toHaveBeenCalledWith(
        expect.objectContaining({
          env: {
            LOG_FORMAT: 'json',
            LOG_LEVEL: 'debug',
            LOG_CONTEXT: 'test-job-id',
            RENOVATE_REPORT_TYPE: 'logging',
            RENOVATE_PLATFORM: 'gitlab',
            RENOVATE_ENDPOINT: 'https://gitlab.com/api/v4',
            RENOVATE_CACHE_DIR: '/custom/cache',
            REDIS_URL: 'redis://localhost:6379',
            HTTP_PROXY: 'http://proxy:8080',
            NODE_ENV: 'production',
          },
        }),
      );
    });
  });
});
