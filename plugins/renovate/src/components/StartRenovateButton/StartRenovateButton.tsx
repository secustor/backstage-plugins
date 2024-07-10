import React, { useState } from 'react';
import { Button, CardActions, CircularProgress } from '@material-ui/core';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import is from '@sindresorhus/is';
import { useApi } from '@backstage/core-plugin-api';
import { renovateApiRef } from '../../api';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';

export interface StartRenovateButtonProps {
  target: string | Entity;
  title?: string;
  onFailure?: () => void;
  onSuccess?: () => void;
}

export function StartRenovateButton(props: StartRenovateButtonProps) {
  const { onFailure, onSuccess, target, title } = props;

  const massagedTarget = is.string(target)
    ? target
    : stringifyEntityRef(target);
  const renovateAPI = useApi(renovateApiRef);

  const [loading, setLoading] = useState<boolean>(false);

  const timer = React.useRef<number>();

  const triggerRenovateRun = async () => {
    if (is.emptyString(massagedTarget)) {
      if (onFailure) {
        onFailure();
      }
      return;
    }

    if (onSuccess) {
      onSuccess();
    }
    setLoading(true);

    await renovateAPI.runsPost({
      body: {
        target: massagedTarget,
      },
    });

    // add some sleep, so it is actually visible that we have done something
    timer.current = window.setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  return (
    <CardActions>
      {loading && <CircularProgress />}
      <Button
        id="run-renovate"
        variant="contained"
        endIcon={<PlayArrowIcon />}
        onClick={triggerRenovateRun}
        disabled={loading}
      >
        {title ?? 'Run Renovate'}
      </Button>
    </CardActions>
  );
}
