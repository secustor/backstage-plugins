import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { renovateRuntimeExtensionPoint } from '@secustor/backstage-plugin-renovate-node';
import { DockerRuntime } from './runtime';

export const renovateModuleRuntimeDocker = createBackendModule({
  pluginId: 'renovate',
  moduleId: 'runtime-docker',
  register(reg) {
    reg.registerInit({
      deps: {
        renovate: renovateRuntimeExtensionPoint,
        logger: coreServices.logger,
      },
      async init({ renovate, logger }) {
        renovate.addRuntime('docker', new DockerRuntime(logger));
      },
    });
  },
});
