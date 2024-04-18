import { getPlatformEnvs } from './index';
import { MockConfigApi } from '@backstage/test-utils';
import { getVoidLogger } from '@backstage/backend-common';

describe('wrapper/platforms', () => {
  it('throw if platform could not be identified', async () => {
    await expect(
      getPlatformEnvs(
        {
          host: 'example.com',
          repository: 'myOrg/myRepo',
        },
        {
          rootConfig: new MockConfigApi({}),
          logger: getVoidLogger(),
        },
      ),
    ).rejects.toThrow(
      `Could not identify platform for target example.com/myOrg/myRepo`,
    );
  });

  it('return env for github.com', async () => {
    await expect(
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
    ).resolves.toEqual({
      RENOVATE_GITHUB_COM: 'aaaaaa',
      RENOVATE_PLATFORM: 'github',
      RENOVATE_REPOSITORIES: 'myOrg/myRepo',
      RENOVATE_TOKEN: 'aaaaaa',
    });
  });

  it('return env for gitlab.com with github.com token', async () => {
    await expect(
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
    ).resolves.toEqual({
      RENOVATE_ENDPOINT: 'https://gitlab.com/api/v4',
      RENOVATE_GITHUB_COM: 'aaaaaa',
      RENOVATE_PLATFORM: 'gitlab',
      RENOVATE_REPOSITORIES: 'myOrg/myRepo',
      RENOVATE_TOKEN: 'bbbbbbbbbb',
    });
  });
});
