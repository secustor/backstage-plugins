import { RenovateClient } from './RenovateClient';
import { mockServices } from '@backstage/backend-test-utils';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer();
const mockBaseUrl = 'http://backstage:9191/i-am-a-mock-base';
const discoveryApiMock = mockServices.discovery.mock();
discoveryApiMock.getBaseUrl.mockResolvedValue(mockBaseUrl);

describe('RenovateClient', () => {
  let client: RenovateClient;
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  beforeEach(() => {
    client = new RenovateClient({ discoveryApi: discoveryApiMock });
  });

  describe('getCurrentReport()', () => {
    it('Should return the newest report', async () => {
      server.use(
        http.get(
          `${mockBaseUrl}/reports/github.com/${encodeURIComponent('foo/bar')}`,
          _info => {
            return HttpResponse.json([
              {
                timestamp: new Date('2024-07-14T08:30:10.245Z'),
              },
              {
                timestamp: new Date('2024-07-13T08:30:10.245Z'),
              },
            ]);
          },
        ),
      );
      await expect(
        client.getCurrentReport('https://github.com/foo/bar'),
      ).resolves.toEqual({
        timestamp: '2024-07-14T08:30:10.245Z',
      });
    });

    it('Should return null for empty result', async () => {
      server.use(
        http.get(
          `${mockBaseUrl}/reports/github.com/${encodeURIComponent('foo/bar')}`,
          _info => {
            return HttpResponse.json([]);
          },
        ),
      );
      await expect(
        client.getCurrentReport('https://github.com/foo/bar'),
      ).resolves.toBeNull();
    });
  });
});
