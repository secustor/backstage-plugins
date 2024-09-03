import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { getEntitySourceLocation } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
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
import { isError } from '@backstage/errors';
import { getBiggestUpdate } from '../../tools';
import { DependencyTableProps, DependencyTableRow } from './types';
import { RenovateEmptyState } from '../RenovateReportEmptyState/RenovateEmptyState';
import { renovateApiRef } from '../../api';

export const DependencyTable = (props: DependencyTableProps) => {
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

  const data = useData(props);

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
      if (response) {
        return repositoryReportResponseElement.parse(response);
      }
      return response;
    }, [entity]);

  if (error) {
    // rethrow error so it is captured by the error panel
    throw error;
  }

  if (loading) {
    return <Progress />;
  }

  if (is.nullOrUndefined(value)) {
    return <RenovateEmptyState />;
  }

  try {
    const { target } = getEntitySourceLocation(entity);
    const parsed = getTargetURL(target);
    const baseURL = scmIntegrationsApi.resolveUrl({
      url: parsed.filepath,
      base: target,
    });

    return (
      <DependencyTable
        packageFiles={value.report.packageFiles}
        filter={{ path: parsed.filepath }}
        baseURL={baseURL}
      />
    );
  } catch (e) {
    return (
      <ResponseErrorPanel
        error={isError(e) ? e : new Error(JSON.stringify(e))}
      />
    );
  }
};

function useData({
  packageFiles,
  filter,
  baseURL,
}: DependencyTableProps): DependencyTableRow[] {
  const scmIntegrationsApi = useApi(scmIntegrationsApiRef);

  const data: DependencyTableRow[] = [];
  let id = 0;
  for (const [manager, packageFilesList] of Object.entries(packageFiles)) {
    for (const packageFileObject of packageFilesList) {
      // filter packages which are not in the same folder or in the tree underneath
      const pathFilter = filter?.path;
      if (pathFilter) {
        if (!packageFileObject.packageFile.startsWith(pathFilter)) {
          continue;
        }
      }
      for (const dependency of packageFileObject.deps) {
        const file = `/${packageFileObject.packageFile}`;

        const biggestUpdate = getBiggestUpdate(dependency.updates ?? []);

        const massagedDepName =
          dependency.depName ?? dependency.registryUrl ?? '';
        data.push({
          id,
          depName: massagedDepName,
          manager,
          packageFile: baseURL ? (
            <Link
              to={scmIntegrationsApi.resolveUrl({ base: baseURL, url: file })}
            >
              {file}
            </Link>
          ) : (
            file
          ),
          depType: dependency.depType,
          currentValue: dependency.currentValue ?? dependency.skipReason ?? '',
          currentVersion: dependency.currentVersion,
          newVersion: biggestUpdate?.newVersion ?? biggestUpdate?.newValue,
        });
        id++;
      }
    }
  }
  return data;
}
