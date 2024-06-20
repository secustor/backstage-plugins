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
  Link,
  Progress,
  ResponseErrorPanel,
  Table,
  TableColumn,
} from '@backstage/core-components';
import is from '@sindresorhus/is';
import { scmIntegrationsApiRef } from '@backstage/integration-react';

type DenseTableProps = {
  filter?: {
    path?: string;
  };
  report: RepositoryReportResponseElement;
  baseURL?: string;
};

export const DependencyTable = ({
  report,
  filter,
  baseURL,
}: DenseTableProps) => {
  const columns: TableColumn[] = [
    { title: 'ID', field: 'id', hidden: true },
    { title: 'Package file', field: 'packageFile' },
    { title: 'Name', field: 'depName' },
    { title: 'Manager', field: 'manager' },
    { title: 'Type', field: 'depType' },
    { title: 'Current Value', field: 'currentValue' },
    { title: 'Current Version', field: 'currentVersion' },
    { title: 'Available Version', field: 'newVersion' },
  ];

  const data = [];
  let id = 0;
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
        const file = packageFileObject.packageFile;
        const biggestUpdate = dependency.updates.reduce(
          (current: any, update: any) => {
            if (current === null) {
              return update;
            }
            // prefer major updates over all other updates
            if (
              current.updateType !== 'major' &&
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

            return current;
          },
          null,
        );
        data.push({
          id,
          depName: dependency.depName,
          manager,
          packageFile: baseURL ? (
            <Link to={`${baseURL}${file}`}>{file}</Link>
          ) : (
            file
          ),
          depType: dependency.depType,
          currentValue: dependency.currentValue,
          currentVersion: dependency.currentVersion,
          newVersion: biggestUpdate?.newVersion,
        });
        id++;
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
  const scmIntegrationsApi = useApi(scmIntegrationsApiRef);

  const { value, loading, error } =
    useAsync(async (): Promise<RepositoryReportResponseElement | null> => {
      const response = await renovateAPI.getCurrentReport(entity);
      return repositoryReportResponseElement.parse(response);
    }, []);

  if (loading || is.nullOrUndefined(value)) {
    return <Progress />;
  }
  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  const { target } = getEntitySourceLocation(entity);
  const parsed = getTargetURL(target);
  const baseURL = scmIntegrationsApi.resolveUrl({
    url: parsed.filepath,
    base: target,
  });
  return (
    <DependencyTable
      report={value}
      filter={{ path: parsed.filepath }}
      baseURL={baseURL}
    />
  );
};
