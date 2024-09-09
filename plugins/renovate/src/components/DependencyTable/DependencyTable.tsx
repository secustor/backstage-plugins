import React, { ReactElement, useState } from 'react';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import {
  Table,
  TableColumn,
  TableFilter,
  TableState,
} from '@backstage/core-components';
import { renovateApiRef } from '../../api';
import useAsync from 'react-use/lib/useAsync';
import { defaultColumns } from './defaultColumns';
import { Dependency } from '@secustor/backstage-plugin-renovate-client';
import { coerceFilter } from '../../tools';

export interface DependencyTableProps {
  columns?: DependencyTableColumn[];
  options?: {
    pageSize?: number;
    pageSizeOptions?: number[];
  };
}

// only allow title to be a string and add showFilter
export type DependencyTableColumn = Omit<TableColumn<Dependency>, 'title'> & {
  title: string;
  showFilter?: 'select' | 'multiple-select';
};

export function DependencyTable(props: DependencyTableProps): ReactElement {
  const renovateAPI = useApi(renovateApiRef);
  const alertAPI = useApi(alertApiRef);

  const columns = props.columns ?? defaultColumns;
  const initialPageSize = props.options?.pageSize ?? 10;
  const pageSizeOptions = props.options?.pageSizeOptions ?? [10, 20, 50];

  // create filters from columns and filter out filters which are not possible or enabled
  const filters = columns
    .map(dependencyColumnToFilter)
    .filter(value => value !== null);

  const [state, setState] = useState<
    { [key: string]: string | string[] } | undefined
  >();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const { value, loading, error } = useAsync(async () => {
    // create query parameters from defined filters and columns
    const queryParameters: Record<string, string[] | undefined> = {};
    for (const filter of filters) {
      const fieldName = columns.find(
        column => column.title === filter.column,
      )?.field;
      if (!fieldName) {
        continue;
      }
      queryParameters[fieldName] = coerceFilter(state?.[filter.column]);
    }

    const response = await renovateAPI.dependenciesGet({
      query: {
        latestOnly: true,
        pageSize,
        page,
        ...queryParameters,
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
  }, [state, page, pageSize]);

  if (error) {
    alertAPI.post({
      severity: 'error',
      message: error.message,
    });
  }

  const onStateChange = (tableState: TableState) => {
    setState(tableState.filters);
  };

  const totalCount = value?.totalCount ?? 0;

  return (
    <Table<Dependency>
      filters={filters}
      columns={columns}
      data={value?.dependencies ?? []}
      isLoading={loading}
      totalCount={totalCount}
      onStateChange={onStateChange}
      onPageChange={(newPage, newPageSize) => {
        setPage(newPage);
        setPageSize(newPageSize);
      }}
      onRowsPerPageChange={newPageSize => setPageSize(newPageSize)}
      options={{
        pageSize,
        pageSizeOptions,
        ...props.options,
      }}
    />
  );
}

export function dependencyColumnToFilter(
  column: DependencyTableColumn,
): TableFilter | null {
  if (!column.field || !column.showFilter) {
    return null;
  }
  return {
    column: column.title,
    type: column.showFilter,
  };
}
