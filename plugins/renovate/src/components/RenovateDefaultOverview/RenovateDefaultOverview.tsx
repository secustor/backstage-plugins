import React from 'react';
import { Grid } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
} from '@backstage/core-components';
import { ReportFetchComponent } from '../ReportFetchComponent';
import { RenovateStarter } from '../RenovateStarter';

export const RenovateDefaultOverview = () => (
  <Page themeId="tool">
    <Header title="Renovate" subtitle="">
      <HeaderLabel label="Owner" value="Developer Experience" />
      <HeaderLabel label="Lifecycle" value="Alpha" />
    </Header>
    <Content>
      <ContentHeader title="Overview">
        <SupportButton>Renovate support</SupportButton>
      </ContentHeader>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <RenovateStarter />
        </Grid>
        <Grid item>
          <ReportFetchComponent />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
