import React from 'react';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { useApi } from '@backstage/core-plugin-api';
import { renovateApiRef } from '../../api';
import {
  repositoryReportResponse,
  RepositoryReportResponse,
} from '@secustor/plugin-renovate-common';
import is from '@sindresorhus/is';

type DenseTableProps = {
  reports: RepositoryReportResponse;
};

export const DenseTable = ({ reports }: DenseTableProps) => {
  const columns: TableColumn[] = [
    { title: 'Host', field: 'host' },
    { title: 'Repository', field: 'repository' },
    { title: 'Last run', field: 'lastUpdated' },
    { title: 'Number of PRs', field: 'noPRs' },
    { title: 'Number of Branches', field: 'noBranches' },
    { title: 'Number of Updates', field: 'noUpdates' },
  ];

  const data = reports.flatMap(report => {
    return {
      host: report.host,
      repository: report.repository,
      lastUpdated: report.lastUpdated,
      noPRs: report.report.branches.filter(
        branch => !is.nullOrUndefined(branch.prNo),
      ).length,
      noBranches: report.report.branches.length,
      noUpdates: report.report.branches.flatMap(branch => branch.upgrades)
        .length,
    };
  });

  return (
    <Table
      title="Report List"
      options={{ search: true, paging: false }}
      columns={columns}
      data={data}
    />
  );
};

export const ReportFetchComponent = () => {
  const renovateAPI = useApi(renovateApiRef);
  const { value, loading, error } =
    useAsync(async (): Promise<RepositoryReportResponse> => {
      const result = await (await renovateAPI.reportsGet({})).json();
      return repositoryReportResponse.parse(result);
    }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return <DenseTable reports={value || []} />;
};
