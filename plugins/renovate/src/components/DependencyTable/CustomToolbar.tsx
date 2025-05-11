import {
  GridToolbarColumnsButton,
  QuickFilter,
  Toolbar,
  GridFilterListIcon,
  GridSlotsComponentsProps,
  QuickFilterControl,
  QuickFilterClear,
  ExportCsv,
} from '@mui/x-data-grid';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Filters } from './Filters';
import type { FilterableColumnDef } from './types';
import Dialog from '@mui/material/Dialog';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Tooltip from '@mui/material/Tooltip';

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    selectedFilters?: Record<string, string[]>;
    onUpdateFilters?: (filters: Record<string, string[]>) => void;
    filterAbleColumns?: FilterableColumnDef[];
  }
}

const StyledQuickFilter = styled(QuickFilter)({
  marginLeft: 'auto',
});

export function CustomToolbar(
  props: NonNullable<GridSlotsComponentsProps['toolbar']>,
) {
  const [filterOpen, toggleFilterOpen] = useState(false);

  const filters =
    props.filterAbleColumns?.filter(column => column.isFilterable ?? true) ??
    [];

  return (
    <Toolbar>
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
      <StyledQuickFilter expanded>
        <QuickFilterControl
          render={({ ref, ...other }) => (
            <TextField
              {...other}
              sx={{ width: 260 }}
              inputRef={ref}
              aria-label="Search"
              placeholder="Search..."
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: other.value ? (
                    <InputAdornment position="end">
                      <QuickFilterClear
                        edge="end"
                        size="small"
                        aria-label="Clear search"
                      >
                        <CancelIcon fontSize="small" />
                      </QuickFilterClear>
                    </InputAdornment>
                  ) : null,
                  ...other.slotProps?.input,
                },
                ...other.slotProps,
              }}
            />
          )}
        />
      </StyledQuickFilter>
      <Tooltip title="Download as CSV">
        <ExportCsv
          options={{
            fileName: 'dependencies',
          }}
          render={
            <Button startIcon={<FileDownloadIcon fontSize="small" />}>
              EXPORT
            </Button>
          }
        />
      </Tooltip>
    </Toolbar>
  );
}

export class CustomToolBarProps {}
