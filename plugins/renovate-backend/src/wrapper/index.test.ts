import { MockConfigApi } from '@backstage/test-utils';
import { getVoidLogger } from '@backstage/backend-common';
import { mockServices } from '@backstage/backend-test-utils';
import { RouterOptions} from '../service/types';
import { RenovateWrapper } from '@secustor/plugin-renovate-common';
import { mockDeep } from 'jest-mock-extended';
import * as _platforms from './platforms';
import * as _configs from '../config'
import { Readable } from 'stream';
import {RenovateRunner} from "./index";
import {DatabaseHandler} from "../service/databaseHandler";
import {TaskRunner, TaskScheduler} from "@backstage/backend-tasks";



describe('wrapper', () => {
  describe('RenovateRunner.from()', () => {
    it('should throw if no schedule is defined', async () => {
      await expect(RenovateRunner.from({
        ...getBaseCTX(),
        pluginConfig: new MockConfigApi({})
      })).rejects.toThrow("Missing required config value at 'schedule'")
    });

    it('should throw if', async () => {
      await expect(RenovateRunner.from({
        ...getBaseCTX(),
        pluginConfig: new MockConfigApi({
          schedule: {
            frequency: {
              minutes: 60
            },
            timeout: {
              minutes: 60
            }
          }
        })
      })).rejects.toThrow("Missing required config value at 'schedule'")
    });
  })

  // it('should throw if runtime is not registered', async () => {
  //   const runner = await RenovateRunner.from({
  //     ...baseCTX,
  //     pluginConfig: new MockConfigApi({
  //       type: "docker"
  //     })
  //   })
  //
  //   await expect(runner.run("test",       {
  //     host: 'github.com',
  //     repository: 'org/repo',
  //   })).rejects.toThrow("Unknown runtime type 'testing'");
  // });
  //
  // it('should run successfully', async () => {
  //   const runtime = mockDeep<RenovateWrapper>();
  //   const ctx = {
  //     ...baseCTX,
  //     runtimes: new Map<string, RenovateWrapper>([['testing', runtime]]),
  //   };
  //   const report = { branches: [] };
  //   platforms.getPlatformEnvs.mockReturnValue({});
  //
  //   runtime.run.mockResolvedValue({
  //     stdout: Readable.from([
  //       `${JSON.stringify({ msg: 'a message' })}\n`,
  //       `${JSON.stringify({ report })}\n`,
  //     ]),
  //   });
  //   await expect(
  //     renovateRepository(
  //       {
  //         host: 'github.com',
  //         repository: 'org/repo',
  //       },
  //       ctx,
  //     ),
  //   ).resolves.toEqual(report);
  //
  //   expect(runtime.run).toHaveBeenCalledWith({
  //     env: {
  //       LOG_FORMAT: 'json',
  //       LOG_LEVEL: 'debug',
  //       LOG_CONTEXT: "",
  //       RENOVATE_REPORT_TYPE: 'logging',
  //     },
  //     renovateConfig: {},
  //     runtimeConfig: expect.anything(),
  //   });
  // });
});

function getBaseCTX(): RouterOptions  {
  const databaseHandlerMock = mockDeep<DatabaseHandler>()
  return  {
  databaseHandler: databaseHandlerMock,
      runtimes: new Map<string, RenovateWrapper>(),
      pluginConfig: new MockConfigApi({}),
      rootConfig: new MockConfigApi({}),
      logger: getVoidLogger(),
      scheduler: mockServices.scheduler.mock(),
};

}