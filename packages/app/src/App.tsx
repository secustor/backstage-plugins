import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import renovatePlugin from '@secustor/backstage-plugin-renovate/alpha';

import { navModule } from './modules/nav';

export default createApp({
  features: [catalogPlugin, navModule, renovatePlugin],
});
