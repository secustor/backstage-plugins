import React, { ReactElement, useMemo } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { renovateApiRef } from '../../api';
import { defaultColumns } from './defaultColumns';
import { DataGrid } from '@mui/x-data-grid/DataGrid';
import Box from '@mui/material/Box';
import { makeStyles } from '@mui/styles';
import { CustomToolbar } from './CustomToolbar';
import type { DependencyTableV2Props, FilterableColumnDef } from './types';
import type { DependenciesGet200ResponseAvailableValues } from '@secustor/backstage-plugin-renovate-client';
import { useQueryParamState } from '@backstage/core-components';

const useTableStyles = makeStyles(
  {
    root: {
      display: 'flex',
      alignItems: 'start',
    },
  },
  { name: 'BackstageTable' },
);

export function DependencyTable(props: DependencyTableV2Props): ReactElement {
  const renovateAPI = useApi(renovateApiRef);
  const alertAPI = useApi(alertApiRef);

  const tableClasses = useTableStyles();

  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 100,
  });

  const initialColumnVisibility = useMemo(() => {
    return (
      props.initialColumnVisibility ?? {
        id: true,
      }
    );
  }, [props.initialColumnVisibility]);

  const [selectedFilters, setSelectedFilters] =
    useQueryParamState<Record<string, string[]>>('filters');

  const { value, loading, error } = useAsync(async () => {
    const response = await renovateAPI.dependenciesGet({
      query: {
        latestOnly: true,
        availableValues: true,
        ...paginationModel,
        ...selectedFilters,
      },
    });
    const { dependencies, availableValues } = await response.json();

    const totalCountHeader = response.headers.get('X-Total-Count');
    const totalCount = totalCountHeader
      ? Number.parseInt(totalCountHeader, 10)
      : dependencies.length;
    return {
      dependencies,
      availableValues,
      totalCount,
    };
  }, [paginationModel, selectedFilters]);

  if (error) {
    alertAPI.post({
      severity: 'error',
      message: error.message,
    });
  }

  const filterAbleColumns = useMemo(() => {
    const columns = props.columns ?? defaultColumns;
    const columnsWithOptions: FilterableColumnDef[] = columns.map(column => {
      const availableValues = value?.availableValues;
      if (!availableValues) {
        return column;
      }

      const field = column.field;
      if (field in availableValues) {
        return {
          ...column,
          filterOptions:
            availableValues[
              field as keyof DependenciesGet200ResponseAvailableValues
            ],
        };
      }
      return column;
    });

    return columnsWithOptions;
  }, [props.columns, value?.availableValues]);

  return (
    <Box className={tableClasses.root}>
      <DataGrid
        autoHeight
        disableColumnMenu
        columns={filterAbleColumns}
        rows={value?.dependencies ?? []}
        rowCount={value?.totalCount}
        loading={loading}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={model => setPaginationModel(model)}
        initialState={{
          columns: {
            columnVisibilityModel: {
              ...initialColumnVisibility,
            },
          },
        }}
        slots={{
          toolbar: CustomToolbar,
        }}
        slotProps={{
          toolbar: {
            filterAbleColumns,
            selectedFilters,
            onUpdateFilters: (filters: Record<string, string[]>) => {
              setSelectedFilters(filters);

              // Reset pagination when filters are updated
              setPaginationModel({
                page: 0,
                pageSize: paginationModel.pageSize,
              });
            },
          },
        }}
      />
    </Box>
  );
}
