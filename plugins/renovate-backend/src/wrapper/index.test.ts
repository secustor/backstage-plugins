import { renovateRepository } from './index';
import { MockConfigApi } from '@backstage/test-utils';
import { getVoidLogger } from '@backstage/backend-common';
import { mockServices } from '@backstage/backend-test-utils';
import { Context } from '../service/types';

describe('test run', () => {
  const databaseMock = mockServices.database.mock();

  it('should run successfully', async () => {
    const ctx: Context = {
      database: databaseMock,
      rootConfig: new MockConfigApi({}),
      logger: getVoidLogger(),
      runID: 'aaaaaaaaa',
    };
    const test = await renovateRepository(
      {
        host: 'github.com',
        repository: 'org/repo',
      },
      ctx,
    );
    expect(test).not.toBeNull();
  });

  it('should run successfully sync', () => {
    const ctx: Context = {
      database: databaseMock,
      rootConfig: new MockConfigApi({}),
      logger: getVoidLogger(),
      runID: 'aaaaaaaaa',
    };
    expect(
      renovateRepository(
        {
          host: 'github.com',
          repository: 'org/repo',
        },
        ctx,
      ),
    ).not.toBeNull();
  });
});
