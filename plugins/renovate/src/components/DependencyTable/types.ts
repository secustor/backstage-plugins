import type { GridColDef, GridColumnVisibilityModel } from '@mui/x-data-grid';
import type { Dependency } from '@secustor/backstage-plugin-renovate-client';

export type FilterableColumnDef = GridColDef<Dependency> & {
  isFilterable?: boolean;
  filterOptions?: string[];
};

export interface DependencyTableV2Props {
  columns?: FilterableColumnDef[];
  initialColumnVisibility?: GridColumnVisibilityModel;
}
