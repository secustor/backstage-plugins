import React, { useState } from 'react';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import NotesIcon from '@material-ui/icons/Notes';
import useAsync from 'react-use/lib/useAsync';
import { useApi } from '@backstage/core-plugin-api';
import { renovateApiRef } from '../../api';
import {
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
    { title: 'timestamp', field: 'timestamp' },
    { title: 'Host', field: 'host' },
    { title: 'Repository', field: 'repository' },
    { title: 'Number of PRs', field: 'noPRs' },
    { title: 'Number of branches', field: 'noBranches' },
    { title: 'Number of updates', field: 'noUpdates' },
    { title: 'Number of dependencies', field: 'noDeps' },
  ];

  const data = reports.flatMap(report => {
    const packageFiles = Object.values(report.report.packageFiles).flat();
    const deps: RowDataEntry[] = packageFiles.flatMap(
      packageFile => packageFile.deps,
    );
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
  });

  const [inspectionDialogData, setInspectionDialogData] =
    useState<RepositoryReportResponseElement | null>(null);

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
