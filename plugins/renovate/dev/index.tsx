import { createApp } from '@backstage/frontend-defaults';
import RenovatePlugin from '../src/alpha.tsx';
import ReactDOM from 'react-dom/client';

const app = createApp({
  features: [RenovatePlugin],
});

ReactDOM.createRoot(document.getElementById('root')!).render(app.createRoot());
