import { getVoidLogger } from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import { MockConfigApi } from '@backstage/test-utils';
import { createRouter } from './router';
import { RenovateWrapper } from '@secustor/plugin-renovate-common';
import { mockDeep } from 'jest-mock-extended';
import * as _databasehandler from './databaseHandler';
import { DatabaseHandler } from './databaseHandler';

// mock database handler
jest.mock('./databaseHandler');
const databaseMock = jest.mocked(_databasehandler);
const databaseHandlerMock = mockDeep<DatabaseHandler>();
databaseMock.DatabaseHandler.create.mockResolvedValue(databaseHandlerMock);

describe('createRouter', () => {
  let app: express.Express;

  beforeAll(async () => {
    const router = await createRouter({
      logger: getVoidLogger(),
      rootConfig: new MockConfigApi({}),
      databaseHandler: mockDeep(),
      runtimes: new Map<string, RenovateWrapper>(),
    });
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toEqual(200);
      expect(response.body).toBe('ok');
    });
  });

  describe('GET /reports', () => {
    it('returns empty array for no reports', async () => {
      databaseHandlerMock.getReports.mockResolvedValue([]);
      const response = await request(app).get('/reports');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual([]);
    });

    it('returns all reports without target', async () => {
      const reportList = [
        {
          branches: [],
          packageFiles: {},
          problems: [],
        },
      ];
      databaseHandlerMock.getReports.mockResolvedValue(reportList);
      const response = await request(app).get('/reports');

      expect(databaseHandlerMock.getReports).toHaveBeenCalledWith(undefined);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(reportList);
    });

    it('returns all reports with target url', async () => {
      const reportList = [
        {
          branches: [],
          packageFiles: {},
          problems: [],
        },
      ];
      databaseHandlerMock.getReports.mockResolvedValue(reportList);
      const response = await request(app)
        .get('/reports')
        .send({ target: 'https://github.com/myOrg/myRepo' });

      expect(databaseHandlerMock.getReports).toHaveBeenCalledWith({
        repository: 'myOrg/myRepo',
        host: 'github.com',
      });
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(reportList);
    });

    it('returns all reports with entity', async () => {
      const reportList = [
        {
          branches: [],
          packageFiles: {},
          problems: [],
        },
      ];
      databaseHandlerMock.getReports.mockResolvedValue(reportList);

      const response = await request(app)
        .get('/reports')
        .send({
          target: {
            metadata: {
              annotations: {
                'backstage.io/source-location':
                  'https://my.gitlab.com/myOrg/myGroup/myRepo',
              },
            },
          },
        });

      expect(databaseHandlerMock.getReports).toHaveBeenCalledWith({
        repository: 'myOrg/myGroup/myRepo',
        host: 'my.gitlab.com',
      });
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(reportList);
    });
  });
});
