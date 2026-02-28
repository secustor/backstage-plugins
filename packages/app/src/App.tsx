import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import renovatePlugin from '@secustor/backstage-plugin-renovate/alpha';

export default createApp({
  features: [catalogPlugin, renovatePlugin],
});
