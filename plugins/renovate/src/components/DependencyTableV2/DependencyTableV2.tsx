import React, { ReactElement, useMemo, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { renovateApiRef } from '../../api';
import { defaultColumns } from './defaultColumns';
import { DataGrid } from '@mui/x-data-grid';
import { GridColumnVisibilityModel } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import { makeStyles } from '@mui/styles';
import { CustomToolbar } from './CustomToolbar';
import { FilterableColumnDef } from './types';
import { DependenciesGet200ResponseAvailableValues } from '@secustor/backstage-plugin-renovate-client';

export interface DependencyTableV2Props {
  columns?: FilterableColumnDef[];
  initialColumnVisibility?: GridColumnVisibilityModel;
}

const useTableStyles = makeStyles(
  {
    root: {
      display: 'flex',
      alignItems: 'start',
    },
  },
  { name: 'BackstageTable' },
);

export function DependencyTableV2(props: DependencyTableV2Props): ReactElement {
  const renovateAPI = useApi(renovateApiRef);
  const alertAPI = useApi(alertApiRef);

  const tableClasses = useTableStyles();

  const initialColumnVisibility = useMemo(() => {
    return (
      props.initialColumnVisibility ?? {
        id: true,
      }
    );
  }, [props.initialColumnVisibility]);

  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});

  const { value, loading, error } = useAsync(async () => {
    const response = await renovateAPI.dependenciesGet({
      query: {
        latestOnly: true,
        availableValues: true,
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
  }, [selectedFilters]);

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
        disableColumnMenu
        columns={filterAbleColumns}
        rows={value?.dependencies ?? []}
        loading={loading}
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
            onUpdateFilters: setSelectedFilters,
          },
        }}
      />
    </Box>
  );
}
