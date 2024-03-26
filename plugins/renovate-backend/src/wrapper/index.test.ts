import { renovateRepository } from './index';
import { MockConfigApi } from '@backstage/test-utils';
import { getVoidLogger } from '@backstage/backend-common';
import { mockServices } from '@backstage/backend-test-utils';
import { Context } from '../service/types';
import { RenovateWrapper } from '@secustor/plugin-renovate-common';
import { mockDeep } from 'jest-mock-extended';
import * as _platforms from './platforms';
import { Readable } from 'stream';

jest.mock('./platforms');
const platforms = jest.mocked(_platforms);

describe('test run', () => {
  const databaseMock = mockServices.database.mock();

  const baseCTX: Context = {
    database: databaseMock,
    runtimes: new Map<string, RenovateWrapper>(),
    runtime: 'testing',
    pluginConfig: new MockConfigApi({}),
    rootConfig: new MockConfigApi({}),
    logger: getVoidLogger(),
    runID: 'aaaaaaaaa',
  };

  it('should throw if runtime is not registered', async () => {
    const result = renovateRepository(
      {
        host: 'github.com',
        repository: 'org/repo',
      },
      baseCTX,
    );
    await expect(result).rejects.toThrow("Unknown runtime type 'testing'");
  });

  it('should run successfully', async () => {
    const runtime = mockDeep<RenovateWrapper>();
    const ctx = {
      ...baseCTX,
      runtimes: new Map<string, RenovateWrapper>([['testing', runtime]]),
    };
    const report = { branches: [] };
    platforms.getPlatformEnvs.mockReturnValue({});

    runtime.run.mockResolvedValue({
      stdout: Readable.from([
        `${JSON.stringify({ msg: 'a message' })}\n`,
        `${JSON.stringify({ report })}\n`,
      ]),
    });
    await expect(
      renovateRepository(
        {
          host: 'github.com',
          repository: 'org/repo',
        },
        ctx,
      ),
    ).resolves.toEqual(report);

    expect(runtime.run).toHaveBeenCalledWith({
      env: {
        LOG_FORMAT: 'json',
        LOG_LEVEL: 'debug',
        LOG_CONTEXT: ctx.runID,
        RENOVATE_REPORT_TYPE: 'logging',
      },
      renovateConfig: {},
      runtimeConfig: expect.anything(),
    });
  });
});
