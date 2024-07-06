import { PackageFiles } from '@secustor/backstage-plugin-renovate-common';
import { ReactElement } from 'react';

export interface DependencyTableProps {
  filter?: {
    path?: string;
  };
  packageFiles: PackageFiles;
  baseURL?: string;
}

export interface DependencyTableRow {
  id: number;
  depName: string;
  manager: string;
  packageFile: string | ReactElement;
  currentValue: string;
  depType: string | undefined | null;
  currentVersion: string | undefined | null;
  newVersion: string | undefined | null;
}
