import { DependencyTableColumn } from './DependencyTable';

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
    field: 'packageFile',
    showFilter: 'multiple-select',
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
