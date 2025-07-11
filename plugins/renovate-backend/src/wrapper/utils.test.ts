import { extractReport, getCacheEnvs, getPassthroughEnvs } from './utils';
import { mockServices } from '@backstage/backend-test-utils';
import { mockApis } from '@backstage/test-utils';
import { PassThrough } from 'stream';
import { RenovateReport } from '@secustor/backstage-plugin-renovate-common';

describe('renovate-backend/wrapper/utils', () => {
  const logger = mockServices.logger.mock();

  describe('extractReport', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('extracts report', async () => {
      const report: RenovateReport = {
        problems: [],
        repositories: {
          'a-repository': {
            problems: [],
            branches: [],
            packageFiles: {
              'a-manager': [],
            },
          },
        },
      };

      const logStream = new PassThrough();
      logStream.write(`${JSON.stringify({ report })}\n`);
      logStream.end();
      await expect(
        extractReport({
          logger,
          logStream,
        }),
      ).resolves.toEqual(report);

      expect(logger.debug).not.toHaveBeenCalled();
    });

    it('extracts report split over multiple log lines', async () => {
      const report: RenovateReport = {
        problems: [],
        repositories: {
          'a-repository': {
            problems: [],
            branches: [],
            packageFiles: {
              'a-manager': [],
            },
          },
        },
      };

      const jsonString = JSON.stringify({ report });

      const logStream = new PassThrough();
      logStream.write(`${jsonString.slice(0, jsonString.length / 2)}`);
      logStream.write(`${jsonString.slice(jsonString.length / 2)}\n`);
      logStream.end();
      await expect(
        extractReport({
          logger,
          logStream,
        }),
      ).resolves.toEqual(report);

      expect(logger.debug).not.toHaveBeenCalled();
    });

    it('should reject if stream ends and no report could be found', () => {
      const logStream = new PassThrough();
      logStream.write(`${JSON.stringify({ msg: 'Foo' })}\n`);
      logStream.write(`${JSON.stringify({ msg: 'Bar' })}\n`);
      logStream.end();
      return expect(
        extractReport({
          logger,
          logStream,
        }),
      ).rejects.toBe('No report found in log stream');
    });

    it('extracts report in between lines', async () => {
      const report: RenovateReport = {
        problems: [],
        repositories: {
          'a-repository': {
            problems: [],
            branches: [],
            packageFiles: {
              'a-manager': [],
            },
          },
        },
      };

      const logStream = new PassThrough();
      logStream.write(`${JSON.stringify({ msg: 'Foo' })}\n`);
      logStream.write(
        `${JSON.stringify({ msg: 'Printing report', report })}\n`,
      );
      logStream.write(`${JSON.stringify({ msg: 'Bar' })}\n`);
      logStream.end();
      await expect(
        extractReport({
          logger,
          logStream,
        }),
      ).resolves.toEqual(report);
    });

    it('forward Renovate log metadata to Backstage logger service', async () => {
      const report: RenovateReport = {
        problems: [],
        repositories: {
          'a-repository': {
            problems: [],
            branches: [],
            packageFiles: {
              'a-manager': [],
            },
          },
        },
      };

      const logStream = new PassThrough();
      logStream.write(
        `${JSON.stringify({ msg: 'Message foo', foo: 'bar' })}\n`,
      );
      logStream.write(
        `${JSON.stringify({ msg: 'Printing report', report })}\n`,
      );
      logStream.write(
        `${JSON.stringify({ msg: 'Message bar', bar: 'foo' })}\n`,
      );
      logStream.end();
      await expect(
        extractReport({
          logger,
          logStream,
        }),
      ).resolves.toEqual(report);
      expect(logger.debug).toHaveBeenNthCalledWith(1, 'Message foo', {
        foo: '"bar"',
      });
      expect(logger.debug).toHaveBeenNthCalledWith(2, 'Message bar', {
        bar: '"foo"',
      });
    });
  });

  describe('getCacheEnvs', () => {
    it('returns empty for empty', () => {
      const config = mockApis.config({
        data: {
          renovate: {},
        },
      });
      expect(getCacheEnvs(config, logger)).toEqual({});
    });

    it('returns config for enabled cache', () => {
      const config = mockApis.config({
        data: {
          backend: {
            cache: {
              store: 'redis',
              connection: 'redis://localhost',
            },
          },
          renovate: {
            cache: {
              enabled: true,
            },
          },
        },
      });
      expect(getCacheEnvs(config, logger)).toEqual({
        RENOVATE_REDIS_PREFIX: 'renovate_',
        RENOVATE_REDIS_URL: 'redis://localhost',
      });
    });

    it('default to enabled cache', () => {
      const config = mockApis.config({
        data: {
          backend: {
            cache: {
              store: 'redis',
              connection: 'redis://localhost',
            },
          },
          renovate: {},
        },
      });
      expect(getCacheEnvs(config, logger)).toEqual({
        RENOVATE_REDIS_PREFIX: 'renovate_',
        RENOVATE_REDIS_URL: 'redis://localhost',
      });
    });

    it('returns empty for disabled cache', () => {
      const config = mockApis.config({
        data: {
          backend: {
            cache: {
              store: 'redis',
              connection: 'redis://localhost',
            },
          },
          renovate: {
            cache: {
              enabled: false,
            },
          },
        },
      });
      expect(getCacheEnvs(config, logger)).toEqual({});
    });

    it('returns empty for no cache', () => {
      const config = mockApis.config({
        data: {
          backend: {},
          renovate: {},
        },
      });
      expect(getCacheEnvs(config, logger)).toEqual({});
    });

    it('returns empty for unsupported cache', () => {
      const config = mockApis.config({
        data: {
          backend: {
            cache: {
              store: 'memcached',
            },
          },
          renovate: {},
        },
      });
      expect(getCacheEnvs(config, logger)).toEqual({});
    });

    it('returns empty for missing connection', () => {
      const config = mockApis.config({
        data: {
          backend: {
            cache: {
              store: 'redis',
            },
          },
          renovate: {},
        },
      });
      expect(getCacheEnvs(config, logger)).toEqual({});
    });
  });

  describe('getPassthroughEvns', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
      process.env.KEY_THREE = 'TEST_THREE';
      process.env.KEY_FOUR = 'TEST_FOUR';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('returns empty for empty', () => {
      const config = mockApis.config({
        data: {
          renovate: {},
        },
      });
      expect(getPassthroughEnvs(config, logger)).toEqual({});
    });

    it('returns config with expected result overrides', () => {
      const config = mockApis.config({
        data: {
          renovate: {
            runtime: {
              environment: [
                { name: 'KEY_ONE', value: 'TEST_ONE' },
                { name: 'KEY_TWO' },
                { name: 'KEY_THREE' },
                { name: 'KEY_FOUR', value: 'OVERRIDE_TEST_FOUR' },
              ],
            },
          },
        },
      });
      expect(getPassthroughEnvs(config, logger)).toEqual({
        KEY_ONE: 'TEST_ONE',
        KEY_THREE: 'TEST_THREE',
        KEY_FOUR: 'OVERRIDE_TEST_FOUR',
      });
    });
  });
});
