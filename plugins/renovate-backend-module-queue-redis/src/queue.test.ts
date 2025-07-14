import { mockServices } from '@backstage/backend-test-utils';
import { mockDeep } from 'jest-mock-extended';
import { RedisQueue } from './queue';
import { Runnable } from '@secustor/backstage-plugin-renovate-node';
import { Queue, Worker } from 'bullmq';

// Mock external dependencies
jest.mock('ioredis');
jest.mock('bullmq');

interface TestData {
  id: string;
  value: string;
}

describe('RedisQueue', () => {
  const mockLogger = mockServices.logger.mock();
  const mockRunnable = mockDeep<Runnable<TestData>>();
  const mockBullQueue = mockDeep<Queue>();
  const mockWorker = mockDeep<Worker>();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock BullMQ Queue constructor
    (Queue as jest.MockedClass<typeof Queue>).mockImplementation(
      () => mockBullQueue as any,
    );

    // Mock BullMQ Worker constructor
    (Worker as jest.MockedClass<typeof Worker>).mockImplementation(
      () => mockWorker as any,
    );

    // Set default worker name (read-only property)
    Object.defineProperty(mockWorker, 'name', { value: 'test-worker' });
  });

  describe('constructor', () => {
    it('should create RedisQueue with cache URL, logger and runnable', () => {
      const queue = new RedisQueue(
        'redis://localhost:6379',
        mockLogger,
        mockRunnable,
      );

      expect(queue).toBeInstanceOf(RedisQueue);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Renovation worker started with test-worker',
      );
    });
  });

  describe('getQueueId', () => {
    it('should return static queue ID', () => {
      const queue = new RedisQueue(
        'redis://localhost:6379',
        mockLogger,
        mockRunnable,
      );

      expect(queue.getQueueId()).toBe('redis');
    });

    it('should return same ID for multiple instances', () => {
      const queue1 = new RedisQueue(
        'redis://localhost:6379',
        mockLogger,
        mockRunnable,
      );
      const queue2 = new RedisQueue(
        'redis://localhost:6380',
        mockLogger,
        mockRunnable,
      );

      expect(queue1.getQueueId()).toBe(queue2.getQueueId());
    });
  });

  describe('add', () => {
    let queue: RedisQueue<TestData>;

    beforeEach(() => {
      queue = new RedisQueue(
        'redis://localhost:6379',
        mockLogger,
        mockRunnable,
      );
    });

    it('should return already-running status when job is active', async () => {
      const testData: TestData = { id: 'test-1', value: 'test-value' };
      mockBullQueue.getJobState.mockResolvedValue('active');

      const result = await queue.add('job-1', testData);

      expect(result).toMatchObject({
        id: 'job-1',
        status: 'already-running',
      });
      expect(mockBullQueue.add).not.toHaveBeenCalled();
    });

    it('should add job to queue when not active', async () => {
      const testData: TestData = { id: 'test-1', value: 'test-value' };
      mockBullQueue.getJobState.mockResolvedValue('completed');

      const result = await queue.add('job-1', testData);

      expect(result).toMatchObject({
        id: 'job-1',
        status: 'queued',
      });
      expect(mockBullQueue.add).toHaveBeenCalledWith('run', testData, {
        jobId: 'job-1',
        lifo: undefined,
      });
    });

    it('should add job to front when insertInFront is true', async () => {
      const testData: TestData = { id: 'test-1', value: 'test-value' };
      mockBullQueue.getJobState.mockResolvedValue('waiting');

      const result = await queue.add('job-1', testData, {
        insertInFront: true,
      });

      expect(result).toMatchObject({
        id: 'job-1',
        status: 'queued',
      });
      expect(mockBullQueue.add).toHaveBeenCalledWith('run', testData, {
        jobId: 'job-1',
        lifo: true,
      });
    });

    it('should handle null job state', async () => {
      const testData: TestData = { id: 'test-1', value: 'test-value' };
      mockBullQueue.getJobState.mockResolvedValue('unknown' as any);

      const result = await queue.add('job-1', testData);

      expect(result).toMatchObject({
        id: 'job-1',
        status: 'queued',
      });
    });
  });

  describe('addBulk', () => {
    let queue: RedisQueue<TestData>;

    beforeEach(() => {
      queue = new RedisQueue(
        'redis://localhost:6379',
        mockLogger,
        mockRunnable,
      );
    });

    it('should add multiple jobs to queue', async () => {
      const entries = [
        { jobId: 'job-1', data: { id: 'test-1', value: 'value-1' } },
        { jobId: 'job-2', data: { id: 'test-2', value: 'value-2' } },
      ];

      mockBullQueue.getJobState
        .mockResolvedValueOnce('waiting')
        .mockResolvedValueOnce('completed');

      const results = await queue.addBulk(entries);

      expect(results).toHaveLength(2);
      expect(results).toMatchObject([
        { id: 'job-1', status: 'queued' },
        { id: 'job-2', status: 'queued' },
      ]);
      expect(mockBullQueue.addBulk).toHaveBeenCalled();
    });

    it('should handle jobs with active status in bulk', async () => {
      const entries = [
        { jobId: 'job-1', data: { id: 'test-1', value: 'value-1' } },
        { jobId: 'job-2', data: { id: 'test-2', value: 'value-2' } },
      ];

      mockBullQueue.getJobState
        .mockResolvedValueOnce('active')
        .mockResolvedValueOnce('waiting');

      const results = await queue.addBulk(entries);

      expect(results).toMatchObject([
        { id: 'job-1', status: 'already-running' },
        { id: 'job-2', status: 'queued' },
      ]);
    });

    it('should remove existing jobs when force option is true', async () => {
      const entries = [
        { jobId: 'job-1', data: { id: 'test-1', value: 'value-1' } },
      ];

      mockBullQueue.getJobState.mockResolvedValue('waiting');
      mockBullQueue.remove.mockResolvedValue(1);

      await queue.addBulk(entries, { force: true });

      expect(mockBullQueue.remove).toHaveBeenCalledWith('job-1');
      expect(mockBullQueue.addBulk).toHaveBeenCalled();
    });

    it('should handle empty entries array', async () => {
      const results = await queue.addBulk([]);

      expect(results).toHaveLength(0);
      expect(mockBullQueue.addBulk).toHaveBeenCalledWith([]);
    });

    it('should add jobs to front when insertInFront is true', async () => {
      const entries = [
        { jobId: 'job-1', data: { id: 'test-1', value: 'value-1' } },
      ];

      mockBullQueue.getJobState.mockResolvedValue('waiting');

      await queue.addBulk(entries, { insertInFront: true });

      const expectedBulkData = expect.arrayContaining([
        expect.objectContaining({
          opts: expect.objectContaining({
            lifo: true,
          }),
        }),
      ]);

      expect(mockBullQueue.addBulk).toHaveBeenCalledWith(expectedBulkData);
    });
  });

  describe('remove', () => {
    let queue: RedisQueue<TestData>;

    beforeEach(() => {
      queue = new RedisQueue(
        'redis://localhost:6379',
        mockLogger,
        mockRunnable,
      );
    });

    it('should return true when job is successfully removed', async () => {
      mockBullQueue.remove.mockResolvedValue(1);

      const result = await queue.remove('job-1');

      expect(result).toBe(true);
      expect(mockBullQueue.remove).toHaveBeenCalledWith('job-1');
    });

    it('should return false when job removal fails', async () => {
      mockBullQueue.remove.mockResolvedValue(0);

      const result = await queue.remove('job-1');

      expect(result).toBe(false);
    });

    it('should return false when job does not exist', async () => {
      mockBullQueue.remove.mockResolvedValue(0);

      const result = await queue.remove('non-existing-job');

      expect(result).toBe(false);
    });
  });

  describe('static id', () => {
    it('should have correct static ID', () => {
      expect(RedisQueue.id).toBe('redis');
    });
  });
});
