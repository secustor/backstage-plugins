import { Direct } from './runtime';
import { mockServices } from '@backstage/backend-test-utils';
import { fork } from 'node:child_process';
import { Readable } from 'stream';
import findUp from 'find-up';

// Mock external dependencies
jest.mock('node:child_process');
jest.mock('find-up');

describe('Direct', () => {
  const mockLogger = mockServices.logger.mock();
  const mockFork = fork as jest.MockedFunction<typeof fork>;
  const mockFindUp = findUp as jest.Mocked<typeof findUp>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('run', () => {
    it('should throw error when renovate binary is not found', async () => {
      mockFindUp.sync.mockReturnValue(undefined);

      const direct = new Direct();
      const runOptions = {
        runID: 'test-run',
        renovateConfig: { repos: ['test/repo'] },
        env: { NODE_ENV: 'test' },
        runtimeConfig: null,
        logger: mockLogger,
      };

      await expect(direct.run(runOptions)).rejects.toThrow(
        'Could not find Renovate bin in node_modules folder',
      );
    });

    it('should fork renovate process when binary is found', async () => {
      const mockBinaryPath = '/path/to/node_modules/.bin/renovate';
      const mockStdout = new Readable();
      const mockChildProcess = {
        stdout: mockStdout,
      } as any;

      mockFindUp.sync.mockReturnValue(mockBinaryPath);
      mockFork.mockReturnValue(mockChildProcess);

      const direct = new Direct();
      const renovateConfig = { repos: ['test/repo'] };
      const runOptions = {
        runID: 'test-run',
        renovateConfig,
        env: { NODE_ENV: 'test' },
        runtimeConfig: null,
        logger: mockLogger,
      };

      const result = await direct.run(runOptions);

      expect(mockFork).toHaveBeenCalledWith(mockBinaryPath, {
        env: {
          NODE_ENV: 'test',
          RENOVATE_CONFIG: JSON.stringify(renovateConfig),
        },
        silent: true,
      });
      expect(result.stdout).toBe(mockStdout);
    });

    it('should set RENOVATE_CONFIG environment variable', async () => {
      const mockBinaryPath = '/path/to/node_modules/.bin/renovate';
      const mockStdout = new Readable();
      const mockChildProcess = {
        stdout: mockStdout,
      } as any;

      mockFindUp.sync.mockReturnValue(mockBinaryPath);
      mockFork.mockReturnValue(mockChildProcess);

      const direct = new Direct();
      const renovateConfig = {
        repos: ['test/repo'],
        platform: 'github',
        token: 'secret-token',
      };
      const runOptions = {
        runID: 'test-run',
        renovateConfig,
        env: { NODE_ENV: 'production' },
        runtimeConfig: null,
        logger: mockLogger,
      };

      await direct.run(runOptions);

      expect(mockFork).toHaveBeenCalledWith(mockBinaryPath, {
        env: {
          NODE_ENV: 'production',
          RENOVATE_CONFIG: JSON.stringify(renovateConfig),
        },
        silent: true,
      });
    });

    it('should preserve existing environment variables', async () => {
      const mockBinaryPath = '/path/to/node_modules/.bin/renovate';
      const mockStdout = new Readable();
      const mockChildProcess = {
        stdout: mockStdout,
      } as any;

      mockFindUp.sync.mockReturnValue(mockBinaryPath);
      mockFork.mockReturnValue(mockChildProcess);

      const direct = new Direct();
      const runOptions = {
        runID: 'test-run',
        renovateConfig: { repos: ['test/repo'] },
        env: {
          NODE_ENV: 'test',
          EXISTING_VAR: 'existing-value',
          ANOTHER_VAR: 'another-value',
        },
        runtimeConfig: null,
        logger: mockLogger,
      };

      await direct.run(runOptions);

      expect(mockFork).toHaveBeenCalledWith(mockBinaryPath, {
        env: {
          NODE_ENV: 'test',
          EXISTING_VAR: 'existing-value',
          ANOTHER_VAR: 'another-value',
          RENOVATE_CONFIG: JSON.stringify({ repos: ['test/repo'] }),
        },
        silent: true,
      });
    });
  });

  describe('findUp behavior', () => {
    it('should use correct findUp configuration', async () => {
      const mockBinaryPath = '/path/to/node_modules/.bin/renovate';
      mockFindUp.sync.mockReturnValue(mockBinaryPath);
      mockFork.mockReturnValue({ stdout: new Readable() } as any);

      const direct = new Direct();
      await direct.run({
        runID: 'test-run',
        renovateConfig: {},
        env: {},
        runtimeConfig: null,
        logger: mockLogger,
      });

      expect(mockFindUp.sync).toHaveBeenCalledWith(expect.any(Function));

      // Test the finder function
      const finderFunction = mockFindUp.sync.mock.calls[0][0] as Function;

      // Mock findUp.sync.exists
      (mockFindUp.sync as any).exists = jest.fn();
      (mockFindUp.sync as any).exists.mockReturnValue(true);

      const result = finderFunction('/some/directory');
      expect(result).toBe('/some/directory/node_modules/.bin/renovate');
      expect((mockFindUp.sync as any).exists).toHaveBeenCalledWith(
        '/some/directory/node_modules/.bin/renovate',
      );
    });
  });
});
