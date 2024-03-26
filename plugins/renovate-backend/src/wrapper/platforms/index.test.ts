import { getPlatformEnvs } from './index';
import { MockConfigApi } from '@backstage/test-utils';
import { getVoidLogger } from '@backstage/backend-common';

describe('wrapper/platforms', () => {
  it('throw if platform could not be identified', () => {
    expect(() =>
      getPlatformEnvs(
        {
          host: 'example.com',
          repository: '',
        },
        {
          rootConfig: new MockConfigApi({}),
          logger: getVoidLogger(),
        },
      ),
    ).toThrow(`Could not identify platform of target`);
  });

  it('return env for github.com', () => {
    expect(
      getPlatformEnvs(
        {
          host: 'github.com',
          repository: 'myOrg/myRepo',
        },
        {
          rootConfig: new MockConfigApi({
            integrations: {
              github: [
                {
                  host: 'github.com',
                  token: 'aaaaaa',
                },
              ],
            },
          }),
          logger: getVoidLogger(),
        },
      ),
    ).toEqual({
      RENOVATE_GITHUB_COM: 'aaaaaa',
      RENOVATE_PLATFORM: 'github',
      RENOVATE_REPOSITORIES: 'myOrg/myRepo',
      RENOVATE_TOKEN: 'aaaaaa',
    });
  });

  it('return env for gitlab.com with github.com token', () => {
    expect(
      getPlatformEnvs(
        {
          host: 'gitlab.com',
          repository: 'myOrg/myRepo',
        },
        {
          rootConfig: new MockConfigApi({
            integrations: {
              github: [
                {
                  host: 'github.com',
                  token: 'aaaaaa',
                },
              ],
              gitlab: [
                {
                  host: 'gitlab.com',
                  token: 'bbbbbbbbbb',
                },
              ],
            },
          }),
          logger: getVoidLogger(),
        },
      ),
    ).toEqual({
      RENOVATE_ENDPOINT: 'https://gitlab.com/api/v4',
      RENOVATE_GITHUB_COM: 'aaaaaa',
      RENOVATE_PLATFORM: 'gitlab',
      RENOVATE_REPOSITORIES: 'myOrg/myRepo',
      RENOVATE_TOKEN: 'bbbbbbbbbb',
    });
  });
});
