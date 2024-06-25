import { getPlatformEnvs } from './index';
import { MockConfigApi } from '@backstage/test-utils';
import { getVoidLogger } from '@backstage/backend-common';
import { mockDeep } from 'jest-mock-extended';
import { DefaultGithubCredentialsProvider } from '@backstage/integration';

const githubCredentialProvider = mockDeep<DefaultGithubCredentialsProvider>();
DefaultGithubCredentialsProvider.fromIntegrations = jest
  .fn()
  .mockReturnValue(githubCredentialProvider);

describe('wrapper/platforms', () => {
  beforeEach(() => {
    githubCredentialProvider.getCredentials.mockReset();
  });

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
    githubCredentialProvider.getCredentials.mockResolvedValue({
      token: 'aaaaaa',
      type: 'token',
    });
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

  it('return env for github.com app', async () => {
    githubCredentialProvider.getCredentials.mockResolvedValue({
      token: 'bbbbbbbbbb',
      type: 'app',
    });
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
                  apps: [
                    {
                      appId: 1000000,
                      clientId: 'aaaaaa',
                      clientSecret: 'aaaaaa',
                      privateKey: 'aaaaaa',
                      webhookSecret: 'aaaaa',
                    },
                  ],
                },
              ],
            },
          }),
          logger: getVoidLogger(),
        },
      ),
    ).resolves.toEqual({
      RENOVATE_GITHUB_COM: 'bbbbbbbbbb',
      RENOVATE_PLATFORM: 'github',
      RENOVATE_REPOSITORIES: 'myOrg/myRepo',
      RENOVATE_TOKEN: 'bbbbbbbbbb',
    });
  });

  it('return env for gitlab.com with github.com token', async () => {
    githubCredentialProvider.getCredentials.mockResolvedValue({
      token: 'aaaaaa',
      type: 'token',
    });
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
