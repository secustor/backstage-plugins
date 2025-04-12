import React, { useState } from 'react';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import NotesIcon from '@mui/icons-material/Notes';
import RefreshIcon from '@mui/icons-material/Refresh';
import useAsync from 'react-use/lib/useAsync';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { renovateApiRef } from '../../api';
import {
  getTargetRepoSafe,
  RepositoryReportResponse,
  RepositoryReportResponseElement,
} from '@secustor/backstage-plugin-renovate-common';
import is from '@sindresorhus/is';
import { InspectReportDialog } from './InspectReportDialog';

type DenseTableProps = {
  reports: RepositoryReportResponse;
  paginate?: boolean;
};

interface RowDataEntry {
  id: string;
  host: string;
  repository: string;
  timestamp: Date;
  noPRs: number;
  noBranches: number;
  noUpdates: number;
  noDeps: number;
  report: RepositoryReportResponseElement;
}

export function ReportTable(options: DenseTableProps) {
  const { reports } = options;
  const columns: TableColumn<RowDataEntry>[] = [
    {
      title: 'timestamp',
      field: 'timestamp',
      defaultSort: 'desc',
      type: 'datetime',
    },
    { title: 'Host', field: 'host' },
    { title: 'Repository', field: 'repository' },
    {
      title: 'Total Libyears',
      field: 'libyears',
      render: rowData =>
        rowData.report.report.libYears?.totalLibYears?.toFixed(2),
      align: 'right',
    },
    { title: 'Number of dependencies', field: 'noDeps' },
    { title: 'Number of outdated dependencies', field: 'outdatedDeps' },
    { title: 'Number of PRs', field: 'noPRs' },
    { title: 'Number of branches', field: 'noBranches' },
    { title: 'Number of updates', field: 'noUpdates' },
  ];

  const data = reports.flatMap(
    report => {
      const packageFiles = Object.values(report.report.packageFiles).flat();
      const deps = packageFiles.flatMap(packageFile => packageFile.deps);
      return {
        id: report.runID,
        host: report.host,
        repository: report.repository,
        libyears: report.report.libYears?.totalLibYears,
        timestamp: report.timestamp,
        noPRs: report.report.branches.filter(
          branch => !is.nullOrUndefined(branch.prNo),
        ).length,
        noBranches: report.report.branches.length,
        noUpdates: report.report.branches.flatMap(branch => branch.upgrades)
          .length,
        outdatedDeps: report.report.libYears?.outdatedDepsCount,
        noDeps: report.report.libYears?.totalDepsCount ?? deps.length,
        report,
      };
    },
    [reports],
  );

  const [inspectionDialogData, setInspectionDialogData] =
    useState<RepositoryReportResponseElement | null>(null);
  const renovateAPI = useApi(renovateApiRef);
  const alertAPI = useApi(alertApiRef);

  return (
    <>
      <Table
        title="Report List"
        options={{
          search: true,
          paging: options.paginate ?? true,
          actionsColumnIndex: -1,
        }}
        columns={columns}
        data={data}
        actions={[
          {
            icon: () => <NotesIcon />,
            tooltip: 'Open raw report',
            onClick: (_event, rowData) => {
              const report = is.array(rowData)
                ? rowData[0].report
                : rowData.report;
              setInspectionDialogData(report);
            },
          },
          rowData => {
            return {
              icon: () => <RefreshIcon />,
              tooltip: 'Rescan',
              onClick: async _event => {
                const target = getTargetRepoSafe(rowData);
                if (!target) {
                  return;
                }
                const result = await renovateAPI.runsPost({
                  body: {
                    target: `${target.host}/${target.repository}`,
                  },
                });
                const test = await result.json();
                if (result.ok) {
                  alertAPI.post({
                    severity: 'success',
                    display: 'transient',
                    message: `Started job ${test.taskID}`,
                  });
                  return;
                }

                alertAPI.post({
                  severity: 'error',
                  message: result.statusText,
                });
              },
            };
          },
        ]}
      />
      <InspectReportDialog
        open={!!inspectionDialogData}
        report={inspectionDialogData}
        onClose={() => setInspectionDialogData(null)}
      />
    </>
  );
}

export const ReportFetchComponent = () => {
  const renovateAPI = useApi(renovateApiRef);
  const { value, loading, error } = useAsync(
    () => renovateAPI.getReports(),
    [],
  );

  if (loading) {
    return <Progress />;
  }
  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return <ReportTable reports={value ?? []} />;
};
