import { getPlatformEnvs } from './index';
import { mockDeep } from 'jest-mock-extended';
import { DefaultGithubCredentialsProvider } from '@backstage/integration';
import { mockServices } from '@backstage/backend-test-utils';

const githubCredentialProvider = mockDeep<DefaultGithubCredentialsProvider>();
DefaultGithubCredentialsProvider.fromIntegrations = jest
  .fn()
  .mockReturnValue(githubCredentialProvider);

describe('wrapper/platforms', () => {
  beforeEach(() => {
    githubCredentialProvider.getCredentials.mockReset();
  });

  it('throw if platform could not be identified', async () => {
    const rootConfig = mockServices.rootConfig({ data: {} });
    await expect(
      getPlatformEnvs(
        {
          host: 'example.com',
          repository: 'myOrg/myRepo',
        },
        {
          rootConfig,
          logger: mockServices.logger.mock(),
        },
      ),
    ).rejects.toThrow(
      `Could not identify platform for target example.com/myOrg/myRepo`,
    );
  });

  it('return env for github.com', async () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        integrations: {
          github: [
            {
              host: 'github.com',
              token: 'aaaaaa',
            },
          ],
        },
      },
    });
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
          rootConfig,
          logger: mockServices.logger.mock(),
        },
      ),
    ).resolves.toEqual({
      GITHUB_COM_TOKEN: 'aaaaaa',
      RENOVATE_PLATFORM: 'github',
      RENOVATE_REPOSITORIES: 'myOrg/myRepo',
      RENOVATE_TOKEN: 'aaaaaa',
    });
  });

  it('return env for github.com app', async () => {
    const rootConfig = mockServices.rootConfig({
      data: {
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
      },
    });
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
          rootConfig,
          logger: mockServices.logger.mock(),
        },
      ),
    ).resolves.toEqual({
      GITHUB_COM_TOKEN: 'bbbbbbbbbb',
      RENOVATE_PLATFORM: 'github',
      RENOVATE_REPOSITORIES: 'myOrg/myRepo',
      RENOVATE_TOKEN: 'bbbbbbbbbb',
    });
  });

  it('return env for gitlab.com with github.com token', async () => {
    const rootConfig = mockServices.rootConfig({
      data: {
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
      },
    });
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
          rootConfig,
          logger: mockServices.logger.mock(),
        },
      ),
    ).resolves.toEqual({
      RENOVATE_ENDPOINT: 'https://gitlab.com/api/v4',
      GITHUB_COM_TOKEN: 'aaaaaa',
      RENOVATE_PLATFORM: 'gitlab',
      RENOVATE_REPOSITORIES: 'myOrg/myRepo',
      RENOVATE_TOKEN: 'bbbbbbbbbb',
    });
  });
});
