import { createBackendModule } from '@backstage/backend-plugin-api';
import { renovateRuntimeExtensionPoint } from '@secustor/backstage-plugin-renovate-node';
import { S3 } from './runtime';

export const renovateModuleRuntimeS3 = createBackendModule({
  pluginId: 'renovate',
  moduleId: 'runtime-s3',
  register(reg) {
    reg.registerInit({
      deps: {
        extension: renovateRuntimeExtensionPoint,
      },
      async init({ extension }) {
        extension.addRuntime('s3', new S3());
      },
    });
  },
});
