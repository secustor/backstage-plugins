import { TargetRepo } from '@secustor/backstage-plugin-renovate-common';

export interface RunOptions {
  id: string;
  target: TargetRepo;
}
