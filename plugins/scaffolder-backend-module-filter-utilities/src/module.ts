import { createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderTemplatingExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createJSONATAFilter } from './filters/jsonata';

/**
 * A backend module that registers the action into the scaffolder
 */
export const scaffolderModule = createBackendModule({
  moduleId: 'filter-utilities',
  pluginId: 'scaffolder',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderTemplating: scaffolderTemplatingExtensionPoint,
      },
      async init({ scaffolderTemplating }) {
        scaffolderTemplating.addTemplateFilters([createJSONATAFilter()]);
      },
    });
  },
});
