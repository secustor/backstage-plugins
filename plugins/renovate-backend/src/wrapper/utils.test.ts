import { getCacheEnvs } from './utils';
import { mockServices } from '@backstage/backend-test-utils';
import { MockConfigApi } from '@backstage/test-utils';

describe('renovate-backend/wrapper/utils', () => {
  const logger = mockServices.logger.mock();
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
