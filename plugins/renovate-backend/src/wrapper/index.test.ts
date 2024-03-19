import { renovateRepository } from './index';
import { MockConfigApi } from '@backstage/test-utils';
import { getVoidLogger } from '@backstage/backend-common';
import { ANNOTATION_SOURCE_LOCATION } from '@backstage/catalog-model';
import { Context } from '../types';

describe('test run', () => {
  it('should run successfully', async () => {
    const ctx: Context = {
      rootConfig: new MockConfigApi({}),
      logger: getVoidLogger(),
      runID: 'aaaaaaaaa',
    };
    const test = await renovateRepository('', ctx);
    expect(test).not.toBeNull();
  });

  it('should run successfully sync', () => {
    const ctx: Context = {
      rootConfig: new MockConfigApi({}),
      logger: getVoidLogger(),
      runID: 'aaaaaaaaa',
    };
    const entity = {
      metadata: {
        annotations: {
          [ANNOTATION_SOURCE_LOCATION]: '',
        },
      },
    };
    expect(renovateRepository(entity, ctx)).not.toBeNull();
  });
});
