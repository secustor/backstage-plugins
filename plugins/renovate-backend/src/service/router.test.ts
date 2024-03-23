import { getVoidLogger } from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import { MockConfigApi } from '@backstage/test-utils';
import { mockServices } from '@backstage/backend-test-utils';
import { createRouter } from './router';
import { RenovateWrapper } from '@secustor/plugin-renovate-common';

describe('createRouter', () => {
  let app: express.Express;
  const databaseMock = mockServices.database.mock();
  beforeAll(async () => {
    const router = await createRouter({
      logger: getVoidLogger(),
      rootConfig: new MockConfigApi({}),
      database: databaseMock,
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
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});
