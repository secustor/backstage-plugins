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

  // create filters from columns and  filter out filters which are not possible or enabled
  const filters = columns
    .map(dependencyColumnToFilter)
    .filter(value => value !== null);

  const [state, setState] = useState<
    { [key: string]: string | string[] } | undefined
  >();

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
        ...queryParameters,
      },
    });
    return await response.json();
  }, [state]);

  if (error) {
    alertAPI.post({
      severity: 'error',
      message: error.message,
    });
  }

  const onStateChange = (tableState: TableState) => {
    setState(tableState.filters);
  };

  return (
    <Table<Dependency>
      filters={filters}
      columns={columns}
      data={value?.dependencies ?? []}
      isLoading={loading}
      onStateChange={onStateChange}
      options={{
        pageSize: 5,
        pageSizeOptions: [5, 20, 25, 50],
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
