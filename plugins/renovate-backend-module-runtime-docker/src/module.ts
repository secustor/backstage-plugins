import {
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { renovateRuntimeExtensionPoint } from '@secustor/plugin-renovate-backend';
import { DockerRuntime } from './runtime';

export const renovateModuleRuntimeDocker = createBackendModule({
  pluginId: 'renovate',
  moduleId: 'runtime-docker',
  register(reg) {
    reg.registerInit({
      deps: {
        renovate: renovateRuntimeExtensionPoint,
      },
      async init({ renovate }) {
        renovate.addRuntime('docker', new DockerRuntime());
      },
    });
  },
});
