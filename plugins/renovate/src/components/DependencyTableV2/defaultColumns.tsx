import { Link } from '@backstage/core-components';
import React from 'react';
import { FilterableColumnDef } from './types';

export const defaultColumns: FilterableColumnDef[] = [
  {
    headerName: 'Host',
    field: 'host',
    flex: 0.5,
  },
  {
    headerName: 'Repository',
    field: 'repository',
    flex: 1,
  },
  {
    headerName: 'Name',
    field: 'depName',
    flex: 1,
    renderCell: ({ row }) => {
      const sourceUrl = row.sourceUrl;
      const depName = row.depName;
      if (sourceUrl) {
        return <Link to={sourceUrl}>{depName}</Link>;
      }
      return depName;
    },
  },
  {
    headerName: 'Manager',
    field: 'manager',
    flex: 1,
  },
  {
    headerName: 'Datasource',
    field: 'datasource',
    flex: 1,
  },
  {
    headerName: 'Type',
    field: 'depType',
    flex: 1,
  },
  {
    headerName: 'Package File',
    field: 'packageFile',
    flex: 1,
    renderCell: ({ row }) => {
      const packageFileUrl = row.packageFileUrl;
      const packageFile = row.packageFile;
      if (packageFileUrl) {
        return <Link to={packageFileUrl}>{packageFile}</Link>;
      }
      return packageFile;
    },
  },
  {
    headerName: 'Current Value',
    field: 'currentValue',
    flex: 1,
    isFilterable: false,
  },
  {
    headerName: 'Skip Reason',
    field: 'skipReason',
    flex: 1,
    isFilterable: false,
  },
];
