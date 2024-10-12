import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { makeStyles } from '@mui/styles';
import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import type { FilterableColumnDef } from './types';

const useFilterStyles = makeStyles(
  _theme => ({
    root: {
      height: '100%',
      width: '315px',
      display: 'flex',
      flexDirection: 'column',
      // marginRight: theme.spacing(3),
      marginRight: 15,
    },
    value: {
      fontWeight: 'bold',
      fontSize: 18,
      margin: 10,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      // height: theme.spacing(7.5),
      justifyContent: 'space-between',
      // borderBottom: `1px solid ${theme.palette.grey[500]}`,
      borderBottom: `1px solid `,
    },
    filters: {
      display: 'flex',
      flexDirection: 'column',
      margin: 10,
      '& > *': {
        // marginTop: theme.spacing(2),
        marginTop: 17,
      },
    },
  }),
  { name: 'BackstageTableFilters' },
);

export type SelectedFilters = {
  [key: string]: string[];
};

type Props = {
  filters: FilterableColumnDef[];
  selectedFilters?: SelectedFilters;
  onChangeFilters?: (arg: Record<string, string[]>) => void;
};

export function Filters(props: Props) {
  const classes = useFilterStyles();

  const { selectedFilters } = props;
  const onChangeFilters = props.onChangeFilters || (() => {});

  const handleResetClick = () => {
    onChangeFilters({});
  };

  // As material table doesn't provide a way to add a column filter tab we will make our own filter logic
  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <Box className={classes.value}>Filter</Box>
        <Button color="primary" onClick={handleResetClick}>
          Clear All
        </Button>
      </Box>
      <Box className={classes.filters}>
        {props.filters.length &&
          props.filters.map(filter => (
            <Autocomplete
              multiple
              value={selectedFilters?.[filter.field] || []}
              key={filter.field}
              renderInput={params => (
                <TextField {...params} label={filter.headerName} />
              )}
              onChange={(_el, value) => {
                const newValue = {
                  ...selectedFilters,
                  [filter.field]: value,
                };
                onChangeFilters(newValue);
              }}
              options={filter.filterOptions || []}
            />
          ))}
      </Box>
    </Box>
  );
}
