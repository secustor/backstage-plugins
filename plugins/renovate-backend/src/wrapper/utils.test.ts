import { extractReport, getCacheEnvs } from './utils';
import { mockServices } from '@backstage/backend-test-utils';
import { MockConfigApi } from '@backstage/test-utils';
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
      const config = new MockConfigApi({
        renovate: {},
      });
      expect(getCacheEnvs(config, logger)).toEqual({});
    });

    it('returns config for enabled cache', () => {
      const config = new MockConfigApi({
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
      });
      expect(getCacheEnvs(config, logger)).toEqual({
        RENOVATE_REDIS_PREFIX: 'renovate_',
        RENOVATE_REDIS_URL: 'redis://localhost',
      });
    });

    it('default to enabled cache', () => {
      const config = new MockConfigApi({
        backend: {
          cache: {
            store: 'redis',
            connection: 'redis://localhost',
          },
        },
        renovate: {},
      });
      expect(getCacheEnvs(config, logger)).toEqual({
        RENOVATE_REDIS_PREFIX: 'renovate_',
        RENOVATE_REDIS_URL: 'redis://localhost',
      });
    });

    it('returns empty for disabled cache', () => {
      const config = new MockConfigApi({
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
      });
      expect(getCacheEnvs(config, logger)).toEqual({});
    });

    it('returns empty for no cache', () => {
      const config = new MockConfigApi({
        backend: {},
        renovate: {},
      });
      expect(getCacheEnvs(config, logger)).toEqual({});
    });

    it('returns empty for unsupported cache', () => {
      const config = new MockConfigApi({
        backend: {
          cache: {
            store: 'memcached',
          },
        },
        renovate: {},
      });
      expect(getCacheEnvs(config, logger)).toEqual({});
    });

    it('returns empty for missing connection', () => {
      const config = new MockConfigApi({
        backend: {
          cache: {
            store: 'redis',
          },
        },
        renovate: {},
      });
      expect(getCacheEnvs(config, logger)).toEqual({});
    });
  });
});
