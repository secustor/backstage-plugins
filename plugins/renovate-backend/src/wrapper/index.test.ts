import { MockConfigApi } from '@backstage/test-utils';
import { getVoidLogger } from '@backstage/backend-common';
import { mockServices } from '@backstage/backend-test-utils';
import { RouterOptions } from '../service/types';
import { RenovateWrapper } from '@secustor/plugin-renovate-common';
import { mockDeep } from 'jest-mock-extended';
import { RenovateRunner } from './index';
import { DatabaseHandler } from '../service/databaseHandler';

describe('wrapper', () => {
  describe('RenovateRunner.from()', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });
    it('should throw if no schedule is defined', async () => {
      const test = getBaseCTX();
      await expect(
        RenovateRunner.from({
          ...test,
          pluginConfig: new MockConfigApi({}),
        }),
      ).rejects.toThrow("Missing required config value at 'schedule'");
    });

    // TODO other test haven't been working because of this error: Error: tried to read ServiceRef.T of serviceRef{core.scheduler}
    // this seems to originate from some mocking issue
  });
});

function getBaseCTX(): RouterOptions {
  const databaseHandlerMock = mockDeep<DatabaseHandler>();
  return {
    databaseHandler: databaseHandlerMock,
    runtimes: new Map<string, RenovateWrapper>(),
    pluginConfig: new MockConfigApi({}),
    rootConfig: new MockConfigApi({}),
    logger: getVoidLogger(),
    scheduler: mockServices.scheduler.mock(),
  };
}
