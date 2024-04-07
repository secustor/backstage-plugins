import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { getEntitySourceLocation } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import { renovateApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';
import {
  getTargetURL,
  repositoryReportResponseElement,
  RepositoryReportResponseElement,
} from '@secustor/backstage-plugin-renovate-common';
import {
  Progress,
  ResponseErrorPanel,
  Table,
  TableColumn,
} from '@backstage/core-components';
import is from '@sindresorhus/is';

type DenseTableProps = {
  filter?: {
    path?: string;
  };
  report: RepositoryReportResponseElement;
};

export const DenseTable = ({ report, filter }: DenseTableProps) => {
  const columns: TableColumn[] = [
    { title: 'Package file', field: 'packageFile' },
    { title: 'Name', field: 'depName' },
    { title: 'Manager', field: 'manager' },
    { title: 'Type', field: 'depType' },
    { title: 'Current Value', field: 'currentValue' },
    { title: 'Current Version', field: 'currentVersion' },
    { title: 'Available Version', field: 'newVersion' },
  ];

  const data = [];
  for (const [manager, packageFilesList] of Object.entries(
    report.report.packageFiles,
  )) {
    for (const packageFileObject of packageFilesList) {
      const pathFilter = filter?.path;
      if (pathFilter) {
        if (!packageFileObject.packageFile.startsWith(pathFilter)) {
          continue;
        }
      }
      for (const dependency of packageFileObject.deps) {
        data.push({
          depName: dependency.depName,
          manager,
          packageFile: packageFileObject.packageFile,
          depType: dependency.depType,
          currentValue: dependency.currentValue,
          currentVersion: dependency.currentVersion,
          newVersion:
            dependency.updates.reduce((current: any, update: any) => {
              if (current === null) {
                return update;
              }
              if (
                current.updateType === 'minor' &&
                update.updateType === 'major'
              ) {
                return update;
              }
              if (
                current.updateType === 'major' &&
                update.updateType === 'major' &&
                update.newMajor > current.newMajor
              ) {
                return update;
              }
              if (
                current.updateType === 'minor' &&
                update.updateType === 'minor' &&
                update.newMinor > current.newMinor
              ) {
                return update;
              }

              return null;
            }, null)?.newVersion ?? '',
        });
      }
    }
  }
  return (
    <Table
      title="Dependencies"
      options={{ search: true, paging: false }}
      columns={columns}
      data={data}
    />
  );
};

export const EntityRenovateContent = () => {
  const { entity } = useEntity();
  const renovateAPI = useApi(renovateApiRef);
  const { value, loading, error } =
    useAsync(async (): Promise<RepositoryReportResponseElement | null> => {
      const response = await renovateAPI.getReport(entity);
      return repositoryReportResponseElement.parse(response);
    }, []);

  if (loading || is.nullOrUndefined(value)) {
    return <Progress />;
  }
  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  const { target } = getEntitySourceLocation(entity);
  const filepath = getTargetURL(target).filepath;
  return <DenseTable report={value} filter={{ path: filepath }} />;
};
