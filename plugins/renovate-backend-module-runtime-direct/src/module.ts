import { createBackendModule } from '@backstage/backend-plugin-api';
import { renovateRuntimeExtensionPoint } from '@secustor/plugin-renovate-backend';
import { Direct } from './runtime';

export const renovateModuleRuntimeDirect = createBackendModule({
  pluginId: 'renovate',
  moduleId: 'runtime-direct',
  register(reg) {
    reg.registerInit({
      deps: {
        extension: renovateRuntimeExtensionPoint,
      },
      async init({ extension }) {
        extension.addRuntime('direct', new Direct());
      },
    });
  },
});
