import React, { useState } from 'react';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import NotesIcon from '@material-ui/icons/Notes';
import RefreshIcon from '@material-ui/icons/Refresh';
import useAsync from 'react-use/lib/useAsync';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { renovateApiRef } from '../../api';
import {
  getTargetRepoSafe,
  repositoryReportResponse,
  RepositoryReportResponse,
  RepositoryReportResponseElement,
} from '@secustor/backstage-plugin-renovate-common';
import is from '@sindresorhus/is';
import { InspectReportDialog } from './InspectReportDialog';

type DenseTableProps = {
  reports: RepositoryReportResponse;
};

interface RowDataEntry {
  id: string;
  host: string;
  repository: string;
  timestamp: string;
  noPRs: number;
  noBranches: number;
  noUpdates: number;
  noDeps: number;
  report: RepositoryReportResponseElement;
}

export const DenseTable = ({ reports }: DenseTableProps) => {
  const columns: TableColumn<RowDataEntry>[] = [
    { title: 'timestamp', field: 'timestamp', defaultSort: 'desc' },
    { title: 'Host', field: 'host' },
    { title: 'Repository', field: 'repository' },
    { title: 'Number of PRs', field: 'noPRs' },
    { title: 'Number of branches', field: 'noBranches' },
    { title: 'Number of updates', field: 'noUpdates' },
    { title: 'Number of dependencies', field: 'noDeps' },
  ];

  const data = reports.flatMap(
    report => {
      const packageFiles = Object.values(report.report.packageFiles).flat();
      const deps = packageFiles.flatMap(packageFile => packageFile.deps);
      return {
        id: report.runID,
        host: report.host,
        repository: report.repository,
        timestamp: report.timestamp,
        noPRs: report.report.branches.filter(
          branch => !is.nullOrUndefined(branch.prNo),
        ).length,
        noBranches: report.report.branches.length,
        noUpdates: report.report.branches.flatMap(branch => branch.upgrades)
          .length,
        noDeps: deps.length,
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
        options={{ search: true, paging: false, actionsColumnIndex: -1 }}
        columns={columns}
        data={data}
        actions={[
          {
            icon: NotesIcon,
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
              icon: RefreshIcon,
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
