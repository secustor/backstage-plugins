import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridFilterListIcon,
  GridToolbarProps,
} from '@mui/x-data-grid';
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Filters } from './Filters';
import type { FilterableColumnDef } from './types';
import Dialog from '@mui/material/Dialog';

export interface CustomToolBarProps extends GridToolbarProps {
  selectedFilters?: Record<string, string[]>;
  onUpdateFilters?: (filters: Record<string, string[]>) => void;
  filterAbleColumns?: FilterableColumnDef[];
}

export function CustomToolbar(props: CustomToolBarProps) {
  const [filterOpen, toggleFilterOpen] = React.useState(false);

  const filters =
    props.filterAbleColumns?.filter(column => column.isFilterable ?? true) ??
    [];

  return (
    <GridToolbarContainer>
      <Button
        title="Open filter drawer"
        startIcon={<GridFilterListIcon />}
        onClick={() => toggleFilterOpen(true)}
        disabled={!props.filterAbleColumns?.length}
      >
        Filters
      </Button>
      {filters.length && (
        <Dialog open={filterOpen} onClose={() => toggleFilterOpen(false)}>
          <Filters
            filters={filters}
            selectedFilters={props.selectedFilters}
            onChangeFilters={props.onUpdateFilters}
          />
        </Dialog>
      )}

      <GridToolbarColumnsButton />
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarQuickFilter variant="standard" />
      <GridToolbarExport
        slotProps={{
          tooltip: { title: 'Export data' },
          button: { variant: 'outlined' },
        }}
      />
    </GridToolbarContainer>
  );
}
