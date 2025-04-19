import { EmptyState } from '@backstage/core-components';
import { StartRenovateButton } from '../StartRenovateButton/StartRenovateButton';
import { useEntity } from '@backstage/plugin-catalog-react';

export function RenovateEmptyState() {
  const { entity } = useEntity();
  return (
    <EmptyState
      title="No Dependency report found"
      missing="data"
      description="It seems like there has not one been any report generated yet."
      action={<StartRenovateButton target={entity} title="Scan this entity" />}
    />
  );
}
