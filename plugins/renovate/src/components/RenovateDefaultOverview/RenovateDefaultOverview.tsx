import { ReactElement } from 'react';
import { Flex } from '@backstage/ui';
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
        <Flex direction="column" gap="3">
          <DependencyTable />
          {props?.showStarter && <RenovateStarter />}
          <ReportFetchComponent />
        </Flex>
      </Content>
    </Page>
  );
}
