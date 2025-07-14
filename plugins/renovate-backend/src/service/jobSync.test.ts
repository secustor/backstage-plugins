import { mockServices } from '@backstage/backend-test-utils';
import { mockDeep } from 'jest-mock-extended';
import {
  CatalogClient,
  CATALOG_FILTER_EXISTS,
} from '@backstage/catalog-client';
import { scheduleJobSync } from './jobSync';
import { RouterOptions } from './types';
import { DatabaseHandler } from './databaseHandler';
import { RenovateRunner } from '../wrapper';
import { Entity } from '@backstage/catalog-model';
import * as configModule from '../config';

// Mock the config module
jest.mock('../config');
const mockConfigModule = jest.mocked(configModule);

// Mock CatalogClient
jest.mock('@backstage/catalog-client');
const MockedCatalogClient = jest.mocked(CatalogClient);

describe('scheduleJobSync', () => {
  let mockRouterOptions: RouterOptions;
  let mockRenovateRunner: jest.Mocked<RenovateRunner>;
  let mockCatalogClient: jest.Mocked<CatalogClient>;
  let mockDatabaseHandler: jest.Mocked<DatabaseHandler>;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;
  let mockScheduler: ReturnType<typeof mockServices.scheduler.mock>;
  let mockAuth: ReturnType<typeof mockServices.auth.mock>;
  let mockDiscovery: ReturnType<typeof mockServices.discovery.mock>;
  let mockRootConfig: ReturnType<typeof mockServices.rootConfig.mock>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRenovateRunner = mockDeep<RenovateRunner>();
    mockCatalogClient = mockDeep<CatalogClient>();
    mockDatabaseHandler = mockDeep<DatabaseHandler>();
    mockLogger = mockServices.logger.mock();
    mockScheduler = mockServices.scheduler.mock();
    mockAuth = mockServices.auth.mock();
    mockDiscovery = mockServices.discovery.mock();
    mockRootConfig = mockServices.rootConfig.mock();

    MockedCatalogClient.mockImplementation(() => mockCatalogClient);

    mockRouterOptions = {
      auth: mockAuth,
      rootConfig: mockRootConfig,
      logger: mockLogger,
      databaseHandler: mockDatabaseHandler,
      runtimes: new Map(),
      queueFactories: new Map(),
      scheduler: mockScheduler,
      discovery: mockDiscovery,
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

    it('should schedule job sync task successfully', async () => {
      await scheduleJobSync(mockRenovateRunner, mockRouterOptions);

      expect(MockedCatalogClient).toHaveBeenCalledWith({
        discoveryApi: mockDiscovery,
      });
      expect(mockConfigModule.getPluginConfig).toHaveBeenCalledWith(
        mockRootConfig,
      );
      expect(mockConfigModule.getScheduleDefinition).toHaveBeenCalledWith(
        mockRootConfig,
        'renovation',
      );
      expect(mockScheduler.scheduleTask).toHaveBeenCalledWith({
        id: 'renovate_scheduled_runs',
        enabled: true,
        scope: 'global',
        frequency: { minutes: 30 },
        timeout: { minutes: 30 },
        fn: expect.any(Function),
      });
    });

    describe('scheduled function execution', () => {
      const mockEntities: Entity[] = [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'test-service',
            namespace: 'default',
            annotations: {
              'renovate.secustor.dev/keep-updated': 'true',
              'backstage.io/source-location':
                'url:https://github.com/test/repo',
            },
          },
          spec: {},
        },
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'another-service',
            namespace: 'production',
            title: 'Another Service',
            annotations: {
              'renovate.secustor.dev/keep-updated': 'enabled',
              'backstage.io/source-location':
                'url:https://gitlab.com/test/another-repo',
            },
          },
          spec: {},
        },
      ];

      beforeEach(() => {
        mockAuth.getOwnServiceCredentials.mockResolvedValue({
          $$type: '@backstage/BackstageCredentials',
          principal: { type: 'service', subject: 'test-service' },
        });
        mockAuth.getPluginRequestToken.mockResolvedValue({
          token: 'mock-token',
        });
        mockCatalogClient.getEntities.mockResolvedValue({
          items: mockEntities,
        });
        mockRenovateRunner.addToQueue.mockResolvedValue([]);
      });

      it('should fetch entities and add them to queue', async () => {
        await scheduleJobSync(mockRenovateRunner, mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;
        await scheduledFn(new AbortController().signal);

        expect(mockAuth.getOwnServiceCredentials).toHaveBeenCalled();
        expect(mockAuth.getPluginRequestToken).toHaveBeenCalledWith({
          onBehalfOf: {
            $$type: '@backstage/BackstageCredentials',
            principal: { type: 'service', subject: 'test-service' },
          },
          targetPluginId: 'catalog',
        });
        expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
          {
            filter: {
              'metadata.annotations.renovate.secustor.dev/keep-updated':
                CATALOG_FILTER_EXISTS,
              'metadata.annotations.backstage.io/source-location':
                CATALOG_FILTER_EXISTS,
            },
            fields: [
              'kind',
              'metadata.annotations',
              'metadata.name',
              'metadata.namespace',
              'metadata.title',
            ],
          },
          { token: 'mock-token' },
        );
        expect(mockRenovateRunner.addToQueue).toHaveBeenCalledWith(
          ...mockEntities,
        );
      });

      it('should handle no entities found', async () => {
        mockCatalogClient.getEntities.mockResolvedValue({
          items: [],
        });

        await scheduleJobSync(mockRenovateRunner, mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;
        await scheduledFn(new AbortController().signal);

        expect(mockRenovateRunner.addToQueue).toHaveBeenCalledWith();
      });

      it('should handle single entity', async () => {
        const singleEntity = mockEntities[0];
        mockCatalogClient.getEntities.mockResolvedValue({
          items: [singleEntity],
        });

        await scheduleJobSync(mockRenovateRunner, mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;
        await scheduledFn(new AbortController().signal);

        expect(mockRenovateRunner.addToQueue).toHaveBeenCalledWith(
          singleEntity,
        );
      });

      it('should use correct catalog filter constants', async () => {
        const expectedFilter = {
          'metadata.annotations.renovate.secustor.dev/keep-updated':
            CATALOG_FILTER_EXISTS,
          'metadata.annotations.backstage.io/source-location':
            CATALOG_FILTER_EXISTS,
        };

        await scheduleJobSync(mockRenovateRunner, mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;
        await scheduledFn(new AbortController().signal);

        expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
          expect.objectContaining({
            filter: expectedFilter,
          }),
          expect.any(Object),
        );
      });

      it('should request only necessary entity fields', async () => {
        const expectedFields = [
          'kind',
          'metadata.annotations',
          'metadata.name',
          'metadata.namespace',
          'metadata.title',
        ];

        await scheduleJobSync(mockRenovateRunner, mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;
        await scheduledFn(new AbortController().signal);

        expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
          expect.objectContaining({
            fields: expectedFields,
          }),
          expect.any(Object),
        );
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        mockAuth.getOwnServiceCredentials.mockResolvedValue({
          $$type: '@backstage/BackstageCredentials',
          principal: { type: 'service', subject: 'test-service' },
        });
      });

      it('should propagate auth errors', async () => {
        const authError = new Error('Authentication failed');
        mockAuth.getPluginRequestToken.mockRejectedValue(authError);

        await scheduleJobSync(mockRenovateRunner, mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;

        await expect(scheduledFn(new AbortController().signal)).rejects.toThrow(
          'Authentication failed',
        );
      });

      it('should propagate catalog client errors', async () => {
        mockAuth.getPluginRequestToken.mockResolvedValue({
          token: 'mock-token',
        });
        const catalogError = new Error('Catalog service unavailable');
        mockCatalogClient.getEntities.mockRejectedValue(catalogError);

        await scheduleJobSync(mockRenovateRunner, mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;

        await expect(scheduledFn(new AbortController().signal)).rejects.toThrow(
          'Catalog service unavailable',
        );
      });

      it('should propagate renovate runner errors', async () => {
        mockAuth.getPluginRequestToken.mockResolvedValue({
          token: 'mock-token',
        });
        mockCatalogClient.getEntities.mockResolvedValue({
          items: [
            {
              apiVersion: 'backstage.io/v1alpha1',
              kind: 'Component',
              metadata: {
                name: 'test-service',
                annotations: {
                  'renovate.secustor.dev/keep-updated': 'true',
                  'backstage.io/source-location':
                    'url:https://github.com/test/repo',
                },
              },
              spec: {},
            },
          ],
        });
        const runnerError = new Error('Queue is full');
        mockRenovateRunner.addToQueue.mockRejectedValue(runnerError);

        await scheduleJobSync(mockRenovateRunner, mockRouterOptions);

        const scheduledFn = mockScheduler.scheduleTask.mock.calls[0][0].fn;

        await expect(scheduledFn(new AbortController().signal)).rejects.toThrow(
          'Queue is full',
        );
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
      const result = await scheduleJobSync(
        mockRenovateRunner,
        mockRouterOptions,
      );

      expect(result).toBeUndefined();
      expect(mockScheduler.scheduleTask).not.toHaveBeenCalled();
      expect(MockedCatalogClient).toHaveBeenCalledWith({
        discoveryApi: mockDiscovery,
      });
      expect(mockConfigModule.getPluginConfig).toHaveBeenCalledWith(
        mockRootConfig,
      );
      expect(mockConfigModule.getScheduleDefinition).toHaveBeenCalledWith(
        mockRootConfig,
        'renovation',
      );
    });
  });

  describe('CatalogClient initialization', () => {
    it('should initialize CatalogClient with correct discovery API', async () => {
      await scheduleJobSync(mockRenovateRunner, mockRouterOptions);

      expect(MockedCatalogClient).toHaveBeenCalledWith({
        discoveryApi: mockDiscovery,
      });
    });
  });
});
