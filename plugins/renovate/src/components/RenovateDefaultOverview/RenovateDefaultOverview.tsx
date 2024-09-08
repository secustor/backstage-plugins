import React, { ReactElement } from 'react';
import Grid from '@mui/material/Grid2';
// import { Grid } from '@material-ui/core';
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
import { DependencyTableV2 } from '../DependencyTableV2';

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
        <Grid container spacing={3} direction="column" size={{ xs: 12 }}>
          <Grid>
            <DependencyTableV2 />
          </Grid>
          {props?.showStarter && (
            <Grid>
              <RenovateStarter />
            </Grid>
          )}
          <Grid>
            <ReportFetchComponent />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
}
