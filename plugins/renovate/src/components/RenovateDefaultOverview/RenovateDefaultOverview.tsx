import React, { ReactElement } from 'react';
import Grid from '@mui/material/Grid2';
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
import { DependencyTable } from '../DependencyTable';

export interface RenovateDefaultOverviewProps {
  showStarter?: boolean;
}

export function RenovateDefaultOverview(
  props?: RenovateDefaultOverviewProps,
): ReactElement {
  return (
    <Page themeId="tool">
      <Header title="Renovate" subtitle="">
        <HeaderLabel label="Owner" value="Developer Experience" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <ContentHeader title="Dependencies">
          <SupportButton>Renovate support</SupportButton>
        </ContentHeader>
        <Grid container spacing={3} direction="column">
          <DependencyTable />
          {props?.showStarter && <RenovateStarter />}
          <Grid>
            <ReportFetchComponent />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
}
