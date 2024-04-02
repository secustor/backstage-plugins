import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { renovatePlugin, RenovatePage } from '../src/plugin';

createDevApp()
  .registerPlugin(renovatePlugin)
  .addPage({
    element: <RenovatePage />,
    title: 'Root Page',
    path: '/renovate',
  })
  .render();
