import { GridColDef } from '@mui/x-data-grid';
import { Dependency } from '@secustor/backstage-plugin-renovate-client';

export type FilterableColumnDef = GridColDef<Dependency> & {
  isFilterable?: boolean;
  filterOptions?: string[];
};
