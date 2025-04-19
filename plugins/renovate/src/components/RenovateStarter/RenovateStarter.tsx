import { InfoCard } from '@backstage/core-components';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { StartRenovateButton } from '../StartRenovateButton/StartRenovateButton';

export const RenovateStarter = () => {
  const [repoURL, setRepoURL] = useState<string>('');
  const [inputError, setInputError] = useState<boolean>(false);

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
      <StartRenovateButton
        target={repoURL}
        onFailure={() => setInputError(true)}
        onSuccess={() => setInputError(false)}
      />
    </InfoCard>
  );
};
