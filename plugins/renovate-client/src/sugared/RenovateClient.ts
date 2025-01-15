import { DefaultApiClient, ReportsGet200ResponseInner } from '../generated';
import {
  getTargetRepoSafe,
  repositoryReportResponse,
  RepositoryReportResponse,
  RepositoryReportResponseElement,
  repositoryReportResponseElement,
  TargetRepo,
} from '@secustor/backstage-plugin-renovate-common';
import { Entity } from '@backstage/catalog-model';

export class RenovateClient extends DefaultApiClient {
  async getCurrentReport(
    target: string | TargetRepo | Entity | null | undefined,
  ): Promise<RepositoryReportResponseElement | null> {
    const targetRepo = getTargetRepoSafe(target);
    if (targetRepo === null) {
      return null;
    }
    const response = await this.reportsHostRepositoryGet({
      path: targetRepo,
    });

    const body = await response.json();

    let result: ReportsGet200ResponseInner | null = null;
    for (const responseElement of body) {
      if (!result) {
        result = responseElement;
      }
      if (result.timestamp < responseElement.timestamp) {
        result = responseElement;
      }
    }

    if (!result) {
      return null;
    }

    return repositoryReportResponseElement.parse(result);
  }

  async getReports(): Promise<RepositoryReportResponse> {
    const response = await this.reportsGet({});
    const body = await response.json();

    return repositoryReportResponse.parse(body);
  }
}
