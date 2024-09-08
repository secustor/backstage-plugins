import { Dependency } from '@secustor/backstage-plugin-renovate-client';
import { Link } from '@backstage/core-components';
import React from 'react';
import { GridColDef } from '@mui/x-data-grid';

export const defaultColumns: GridColDef<Dependency>[] = [
  {
    field: 'id',
    headerName: 'ID',
  },
  {
    headerName: 'Host',
    field: 'host',
  },
  {
    headerName: 'Repository',
    field: 'repository',
  },
  {
    headerName: 'Name',
    field: 'depName',
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
  },
  {
    headerName: 'Type',
    field: 'depType',
  },
  {
    headerName: 'Package File',
    field: 'packageFile',

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
  },
  {
    headerName: 'Current Version',
    field: 'currentVersion',
  },
  {
    headerName: 'Skip Reason',
    field: 'skipReason',
  },
];
