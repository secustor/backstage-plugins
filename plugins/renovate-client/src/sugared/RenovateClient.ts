import { DefaultApiClient, ReportsGet200ResponseInner } from '../generated';
import {
  getTargetRepoSafe,
  TargetRepo,
} from '@secustor/backstage-plugin-renovate-common';
import { Entity } from '@backstage/catalog-model';

export class RenovateClient extends DefaultApiClient {
  async getCurrentReport(
    target: string | TargetRepo | Entity | null | undefined,
  ): Promise<ReportsGet200ResponseInner | null> {
    const targetRepo = getTargetRepoSafe(target);
    if (targetRepo === null) {
      return null;
    }
    const response = await this.reportsHostRepositoryGet({
      path: targetRepo,
    }).then(value => value.json());
    return response.reduce((previousValue, currentValue) => {
      if (previousValue.timestamp < currentValue.timestamp) {
        return currentValue;
      }
      return previousValue;
    });
  }
}
