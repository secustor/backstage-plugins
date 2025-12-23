import { useState } from 'react';
import { Button, Flex } from '@backstage/ui';
import CircularProgress from '@mui/material/CircularProgress';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import is from '@sindresorhus/is';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
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

  const alertAPI = useApi(alertApiRef);

  const massagedTarget = is.string(target)
    ? target
    : stringifyEntityRef(target);
  const renovateAPI = useApi(renovateApiRef);

  const [loading, setLoading] = useState<boolean>(false);

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

    const result = await renovateAPI.runsPost({
      body: {
        target: massagedTarget,
      },
    });
    const body = await result.json();

    setLoading(false);

    if (result.ok) {
      alertAPI.post({
        severity: 'success',
        display: 'transient',
        message: `Started job ${body.taskID}`,
      });
      return;
    }

    alertAPI.post({
      severity: 'error',
      message: result.statusText,
    });
  };

  return (
    <Flex direction="row" gap="2" style={{ padding: '8px' }}>
      {loading && <CircularProgress />}
      <Button
        id="run-renovate"
        variant="primary"
        iconEnd={<PlayArrowIcon />}
        onPress={triggerRenovateRun}
        isDisabled={loading}
      >
        {title ?? 'Run Renovate'}
      </Button>
    </Flex>
  );
}
