import { InfoCard } from '@backstage/core-components';
import {
  Button,
  CardActions,
  CircularProgress,
  TextField,
} from '@material-ui/core';
import React, { useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { renovateApiRef } from '../../api';
import is from '@sindresorhus/is';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

export const RenovateStarter = () => {
  const renovateAPI = useApi(renovateApiRef);
  const [repoURL, setRepoURL] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [inputError, setInputError] = useState<boolean>(false);

  const timer = React.useRef<number>();

  const triggerRenovateRun = async () => {
    if (is.emptyString(repoURL)) {
      setInputError(true);
      return;
    }

    setInputError(false);
    setLoading(true);

    await renovateAPI.runsPost({
      body: {
        target: repoURL,
      },
    });

    // add some sleep, so it is actually visible that we have done something
    timer.current = window.setTimeout(() => {
      setLoading(false);
    }, 500);
  };
  return (
    <InfoCard title="Run Renovate">
      <TextField
        fullWidth
        error={inputError}
        helperText={inputError ? 'Add a source url to run Renovate' : ''}
        id="repo-url"
        label="RepoURL"
        onChange={e => setRepoURL(e.target.value)}
        margin="normal"
      />
      <CardActions>
        {loading && <CircularProgress />}
        <Button
          id="run-renovate"
          variant="contained"
          endIcon={<PlayArrowIcon />}
          onClick={triggerRenovateRun}
          disabled={loading}
        >
          Run Renovate
        </Button>
      </CardActions>
    </InfoCard>
  );
};
