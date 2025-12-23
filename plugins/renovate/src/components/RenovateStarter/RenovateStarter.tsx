import { InfoCard } from '@backstage/core-components';
import { TextField } from '@backstage/ui';
import { useState } from 'react';
import { StartRenovateButton } from '../StartRenovateButton/StartRenovateButton';

export const RenovateStarter = () => {
  const [repoURL, setRepoURL] = useState<string>('');
  const [inputError, setInputError] = useState<boolean>(false);

  return (
    <InfoCard title="Run Renovate">
      <TextField
        style={{ width: '100%', marginTop: '16px', marginBottom: '16px' }}
        description={inputError ? 'Add a source url to run Renovate' : ''}
        id="repo-url"
        label="RepoURL"
        onChange={value => setRepoURL(value)}
        name="repo-url"
      />
      <StartRenovateButton
        target={repoURL}
        onFailure={() => setInputError(true)}
        onSuccess={() => setInputError(false)}
      />
    </InfoCard>
  );
};
