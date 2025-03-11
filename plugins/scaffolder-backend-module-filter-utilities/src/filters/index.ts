import { CreatedTemplateFilter } from '@backstage/plugin-scaffolder-node/alpha';
import { createJSONATAFilter } from './jsonata';

export function createFilters(): CreatedTemplateFilter[] {
  return [createJSONATAFilter()];
}
