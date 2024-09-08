import React, { ReactElement } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { renovateApiRef } from '../../api';
import { defaultColumns } from './defaultColumns';
import { Dependency } from '@secustor/backstage-plugin-renovate-client';
import { DataGrid } from '@mui/x-data-grid';
import { GridColDef, GridToolbar } from '@mui/x-data-grid';
import { GridColumnVisibilityModel } from '@mui/x-data-grid';

export interface DependencyTableV2Props {
  columns?: GridColDef<Dependency>[];
  initialColumnVisibility?: GridColumnVisibilityModel;
}

export function DependencyTableV2(props: DependencyTableV2Props): ReactElement {
  const renovateAPI = useApi(renovateApiRef);
  const alertAPI = useApi(alertApiRef);

  const columns: GridColDef<Dependency>[] = props.columns ?? defaultColumns;

  const {
    value: data,
    loading,
    error,
  } = useAsync(async () => {
    // create query parameters from defined filters and columns
    const queryParameters: Record<string, string[] | undefined> = {};

    const response = await renovateAPI.dependenciesGet({
      query: {
        latestOnly: true,
        ...queryParameters,
      },
    });
    return await response.json();
  }, []);

  if (error) {
    alertAPI.post({
      severity: 'error',
      message: error.message,
    });
  }

  return (
    <DataGrid
      columns={columns}
      rows={data}
      loading={loading}
      initialState={{
        columns: {
          columnVisibilityModel: {
            id: true,
          },
        },
      }}
      slots={{
        toolbar: GridToolbar,
      }}
    />
  );
}
