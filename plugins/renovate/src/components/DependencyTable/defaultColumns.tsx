import React from 'react';
import { DependencyTableColumn } from './DependencyTable';
import { Link } from '@backstage/core-components';

export const defaultColumns: DependencyTableColumn[] = [
  {
    title: 'id',
    hidden: true,
    field: 'id',
  },
  {
    title: 'Host',
    width: 'auto',
    field: 'host',
    showFilter: 'multiple-select',
  },
  {
    title: 'Repository',
    width: 'auto',
    field: 'repository',
    showFilter: 'multiple-select',
  },
  {
    title: 'Name',
    width: 'auto',
    field: 'depName',
    showFilter: 'multiple-select',
    render: rowData => {
      if (rowData.sourceUrl) {
        return <Link to={rowData.sourceUrl}>{rowData.depName}</Link>;
      }
      return rowData.depName;
    },
  },
  {
    title: 'Manager',
    width: 'auto',
    field: 'manager',
    showFilter: 'multiple-select',
  },
  {
    title: 'Type',
    width: 'auto',
    field: 'depType',
    showFilter: 'multiple-select',
  },
  {
    title: 'Package File',
    width: 'auto',
    showFilter: 'multiple-select',
    render: rowData => {
      if (rowData.packageFileUrl) {
        return <Link to={rowData.packageFileUrl}>{rowData.packageFile}</Link>;
      }
      return rowData.packageFile;
    },
  },
  {
    title: 'Current Value',
    width: 'auto',
    field: 'currentValue',
  },
  {
    title: 'Current Version',
    width: 'auto',
    field: 'currentVersion',
  },
  {
    title: 'skipReason',
    width: 'auto',
    field: 'skipReason',
    showFilter: 'multiple-select',
  },
];
