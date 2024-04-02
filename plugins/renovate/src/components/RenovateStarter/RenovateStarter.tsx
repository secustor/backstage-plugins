import { InfoCard } from '@backstage/core-components';
import { Button, CardActions, TextField } from '@material-ui/core';
import React, { useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { renovateApiRef } from '../../api';
import is from '@sindresorhus/is';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

export const RenovateStarter = () => {
  const renovateAPI = useApi(renovateApiRef);
  const [value, setValue] = useState<string>('');

  const triggerRenovateRun = async () => {
    if (is.emptyString(value)) {
      return;
    }

    await renovateAPI.runsPost({
      body: {
        target: value,
      },
    });
  };
  return (
    <InfoCard title="Run Renovate">
      <TextField
        id="repo-url"
        label="RepoURL"
        onChange={e => setValue(e.target.value)}
      />
      <CardActions>
        <Button
          id="run-renovate"
          variant="contained"
          endIcon={<PlayArrowIcon />}
          onClick={triggerRenovateRun}
        >
          Run Renovate
        </Button>
      </CardActions>
    </InfoCard>
  );
};
