// Mock createExtensionPoint before importing the module
jest.mock('@backstage/backend-plugin-api', () => ({
  createExtensionPoint: jest.fn(),
}));

import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { mockDeep } from 'jest-mock-extended';
import { RenovateWrapper } from '@secustor/backstage-plugin-renovate-common';
import { QueueFactory } from './queue/types';
import { RunOptions } from './types';

const mockCreateExtensionPoint = jest.mocked(createExtensionPoint);

// Setup mock return values before importing the extension points
const mockRuntimeExtensionPoint = { id: 'renovate.runtimes' };
const mockQueueExtensionPoint = { id: 'renovate.queues' };

mockCreateExtensionPoint
  .mockReturnValueOnce(mockRuntimeExtensionPoint as any)
  .mockReturnValueOnce(mockQueueExtensionPoint as any);

// Now import the extension points after mocks are set up
import {
  renovateRuntimeExtensionPoint,
  renovateQueueExtensionPoint,
  RenovateRuntimeExtensionPoint,
  RenovateQueueExtensionPoint,
} from './extensionPoints';

describe('extensionPoints', () => {
  describe('renovateRuntimeExtensionPoint', () => {
    it('should create runtime extension point with correct configuration', () => {
      expect(mockCreateExtensionPoint).toHaveBeenCalledWith({
        id: 'renovate.runtimes',
      });
      expect(renovateRuntimeExtensionPoint).toEqual(mockRuntimeExtensionPoint);
    });
  });

  describe('renovateQueueExtensionPoint', () => {
    it('should create queue extension point with correct configuration', () => {
      expect(mockCreateExtensionPoint).toHaveBeenCalledWith({
        id: 'renovate.queues',
      });
      expect(renovateQueueExtensionPoint).toEqual(mockQueueExtensionPoint);
    });
  });

  describe('RenovateRuntimeExtensionPoint interface', () => {
    it('should define addRuntime method signature correctly', () => {
      const mockRuntime = mockDeep<RenovateWrapper>();
      const mockImplementation: RenovateRuntimeExtensionPoint = {
        addRuntime: jest.fn(),
      };

      // Test that the interface can be implemented and called correctly
      mockImplementation.addRuntime('docker', mockRuntime);

      expect(mockImplementation.addRuntime).toHaveBeenCalledWith(
        'docker',
        mockRuntime,
      );
    });

    it('should support multiple runtime types', () => {
      const dockerRuntime = mockDeep<RenovateWrapper>();
      const directRuntime = mockDeep<RenovateWrapper>();
      const s3Runtime = mockDeep<RenovateWrapper>();

      const mockImplementation: RenovateRuntimeExtensionPoint = {
        addRuntime: jest.fn(),
      };

      mockImplementation.addRuntime('docker', dockerRuntime);
      mockImplementation.addRuntime('direct', directRuntime);
      mockImplementation.addRuntime('s3', s3Runtime);

      expect(mockImplementation.addRuntime).toHaveBeenCalledTimes(3);
      expect(mockImplementation.addRuntime).toHaveBeenNthCalledWith(
        1,
        'docker',
        dockerRuntime,
      );
      expect(mockImplementation.addRuntime).toHaveBeenNthCalledWith(
        2,
        'direct',
        directRuntime,
      );
      expect(mockImplementation.addRuntime).toHaveBeenNthCalledWith(
        3,
        's3',
        s3Runtime,
      );
    });
  });

  describe('RenovateQueueExtensionPoint interface', () => {
    it('should define addQueueFactory method signature correctly', () => {
      const mockQueueFactory = jest.fn() as QueueFactory<RunOptions>;
      const mockImplementation: RenovateQueueExtensionPoint<RunOptions> = {
        addQueueFactory: jest.fn().mockReturnValue('queue-id'),
      };

      const result = mockImplementation.addQueueFactory(
        'redis',
        mockQueueFactory,
      );

      expect(mockImplementation.addQueueFactory).toHaveBeenCalledWith(
        'redis',
        mockQueueFactory,
      );
      expect(result).toBe('queue-id');
    });

    it('should support multiple queue factory types', () => {
      const localQueueFactory = jest.fn() as QueueFactory<RunOptions>;
      const redisQueueFactory = jest.fn() as QueueFactory<RunOptions>;

      const mockImplementation: RenovateQueueExtensionPoint<RunOptions> = {
        addQueueFactory: jest
          .fn()
          .mockReturnValueOnce('local-queue-id')
          .mockReturnValueOnce('redis-queue-id'),
      };

      const localResult = mockImplementation.addQueueFactory(
        'local',
        localQueueFactory,
      );
      const redisResult = mockImplementation.addQueueFactory(
        'redis',
        redisQueueFactory,
      );

      expect(mockImplementation.addQueueFactory).toHaveBeenCalledTimes(2);
      expect(mockImplementation.addQueueFactory).toHaveBeenNthCalledWith(
        1,
        'local',
        localQueueFactory,
      );
      expect(mockImplementation.addQueueFactory).toHaveBeenNthCalledWith(
        2,
        'redis',
        redisQueueFactory,
      );
      expect(localResult).toBe('local-queue-id');
      expect(redisResult).toBe('redis-queue-id');
    });

    it('should be generic and work with different RunOptions types', () => {
      interface CustomRunOptions extends RunOptions {
        customProperty: string;
      }

      const mockQueueFactory = jest.fn() as QueueFactory<CustomRunOptions>;
      const mockImplementation: RenovateQueueExtensionPoint<CustomRunOptions> =
        {
          addQueueFactory: jest.fn().mockReturnValue('custom-queue-id'),
        };

      const result = mockImplementation.addQueueFactory(
        'custom',
        mockQueueFactory,
      );

      expect(mockImplementation.addQueueFactory).toHaveBeenCalledWith(
        'custom',
        mockQueueFactory,
      );
      expect(result).toBe('custom-queue-id');
    });
  });

  describe('extension point types consistency', () => {
    it('should ensure runtime extension point accepts RenovateWrapper', () => {
      const mockRuntime = mockDeep<RenovateWrapper>();

      // This test ensures the types are consistent
      const testFunction = (extensionPoint: RenovateRuntimeExtensionPoint) => {
        extensionPoint.addRuntime('test', mockRuntime);
      };

      const mockImplementation: RenovateRuntimeExtensionPoint = {
        addRuntime: jest.fn(),
      };

      expect(() => testFunction(mockImplementation)).not.toThrow();
      expect(mockImplementation.addRuntime).toHaveBeenCalledWith(
        'test',
        mockRuntime,
      );
    });

    it('should ensure queue extension point accepts QueueFactory', () => {
      const mockQueueFactory = jest.fn() as QueueFactory<RunOptions>;

      // This test ensures the types are consistent
      const testFunction = (
        extensionPoint: RenovateQueueExtensionPoint<RunOptions>,
      ) => {
        return extensionPoint.addQueueFactory('test', mockQueueFactory);
      };

      const mockImplementation: RenovateQueueExtensionPoint<RunOptions> = {
        addQueueFactory: jest.fn().mockReturnValue('test-id'),
      };

      const result = testFunction(mockImplementation);

      expect(mockImplementation.addQueueFactory).toHaveBeenCalledWith(
        'test',
        mockQueueFactory,
      );
      expect(result).toBe('test-id');
    });
  });

  describe('extension point IDs', () => {
    it.each`
      extensionPoint                   | expectedId
      ${renovateRuntimeExtensionPoint} | ${'renovate.runtimes'}
      ${renovateQueueExtensionPoint}   | ${'renovate.queues'}
    `('should have correct ID for $extensionPoint', ({ expectedId }) => {
      expect(mockCreateExtensionPoint).toHaveBeenCalledWith(
        expect.objectContaining({ id: expectedId }),
      );
    });

    it('should use consistent naming convention', () => {
      const calls = mockCreateExtensionPoint.mock.calls;
      const ids = calls.map(call => call[0].id);

      // All IDs should start with 'renovate.'
      ids.forEach(id => {
        expect(id).toMatch(/^renovate\./);
      });

      // IDs should be descriptive and plural
      expect(ids).toContain('renovate.runtimes');
      expect(ids).toContain('renovate.queues');
    });
  });
});
