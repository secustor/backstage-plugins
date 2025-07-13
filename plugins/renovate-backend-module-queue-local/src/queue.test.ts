import { mockServices } from '@backstage/backend-test-utils';
import { mockDeep } from 'jest-mock-extended';
import { LocalQueue } from './queue';
import { Runnable } from '@secustor/backstage-plugin-renovate-node';

interface TestData {
  id: string;
  value: string;
}

describe('LocalQueue', () => {
  const mockLogger = mockServices.logger.mock();
  const mockRunnable = mockDeep<Runnable<TestData>>();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create LocalQueue with logger and runnable', () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);
      expect(queue).toBeInstanceOf(LocalQueue);
    });
  });

  describe('getQueueId', () => {
    it('should return static queue ID', () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);
      expect(queue.getQueueId()).toBe('local-fastq');
    });

    it('should return same ID for multiple instances', () => {
      const queue1 = new LocalQueue(mockLogger, mockRunnable);
      const queue2 = new LocalQueue(mockLogger, mockRunnable);
      expect(queue1.getQueueId()).toBe(queue2.getQueueId());
    });
  });

  describe('add', () => {
    it('should add job to queue without options', async () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);
      const testData: TestData = { id: 'test-1', value: 'test-value' };

      const result = await queue.add('job-1', testData);

      expect(result).toMatchObject({
        id: 'job-1',
        status: 'queued',
      });
    });

    it('should add job to front when insertInFront is true', async () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);
      const testData: TestData = { id: 'test-1', value: 'test-value' };

      const result = await queue.add('job-1', testData, {
        insertInFront: true,
      });

      expect(result).toMatchObject({
        id: 'job-1',
        status: 'queued',
      });
    });

    it('should warn when options are provided', async () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);
      const testData: TestData = { id: 'test-1', value: 'test-value' };

      await queue.add('job-1', testData, { force: true });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'AddOptions are not implement for local-fastq',
      );
    });

    it('should not warn when no options are provided', async () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);
      const testData: TestData = { id: 'test-1', value: 'test-value' };

      await queue.add('job-1', testData);

      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should handle multiple jobs with different IDs', async () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);
      const testData1: TestData = { id: 'test-1', value: 'value-1' };
      const testData2: TestData = { id: 'test-2', value: 'value-2' };

      const result1 = await queue.add('job-1', testData1);
      const result2 = await queue.add('job-2', testData2);

      expect(result1.id).toBe('job-1');
      expect(result2.id).toBe('job-2');
      expect(result1.status).toBe('queued');
      expect(result2.status).toBe('queued');
    });
  });

  describe('addBulk', () => {
    it('should add multiple jobs to queue', async () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);
      const entries = [
        { jobId: 'job-1', data: { id: 'test-1', value: 'value-1' } },
        { jobId: 'job-2', data: { id: 'test-2', value: 'value-2' } },
        { jobId: 'job-3', data: { id: 'test-3', value: 'value-3' } },
      ];

      const results = await queue.addBulk(entries);

      expect(results).toHaveLength(3);
      expect(results).toMatchObject([
        { id: 'job-1', status: 'queued' },
        { id: 'job-2', status: 'queued' },
        { id: 'job-3', status: 'queued' },
      ]);
    });

    it('should add bulk jobs to front when insertInFront is true', async () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);
      const entries = [
        { jobId: 'job-1', data: { id: 'test-1', value: 'value-1' } },
        { jobId: 'job-2', data: { id: 'test-2', value: 'value-2' } },
      ];

      const results = await queue.addBulk(entries, { insertInFront: true });

      expect(results).toHaveLength(2);
      expect(results).toMatchObject([
        { id: 'job-1', status: 'queued' },
        { id: 'job-2', status: 'queued' },
      ]);
    });

    it('should handle empty entries array', async () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);

      const results = await queue.addBulk([]);

      expect(results).toHaveLength(0);
      expect(results).toEqual([]);
    });

    it('should handle single entry in bulk', async () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);
      const entries = [
        { jobId: 'job-1', data: { id: 'test-1', value: 'value-1' } },
      ];

      const results = await queue.addBulk(entries);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'job-1',
        status: 'queued',
      });
    });
  });

  describe('remove', () => {
    it('should return false and log warning', async () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);

      const result = await queue.remove('job-1');

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Remove is not implemented for local-fastq',
      );
    });

    it('should always return false regardless of job ID', async () => {
      const queue = new LocalQueue(mockLogger, mockRunnable);

      const result1 = await queue.remove('existing-job');
      const result2 = await queue.remove('non-existing-job');
      const result3 = await queue.remove('');

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
    });
  });

  describe('static id', () => {
    it('should have correct static ID', () => {
      expect(LocalQueue.id).toBe('local-fastq');
    });
  });
});
