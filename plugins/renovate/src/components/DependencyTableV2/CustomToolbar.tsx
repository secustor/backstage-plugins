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
import Popover from '@mui/material/Popover';
import { Filters } from './Filters';
import { FilterableColumnDef } from './types';

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
        <Popover
          open={filterOpen}
          onClose={() => toggleFilterOpen(false)}
          anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
        >
          <Filters
            filters={filters}
            selectedFilters={props.selectedFilters}
            onChangeFilters={props.onUpdateFilters}
          />
        </Popover>
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
