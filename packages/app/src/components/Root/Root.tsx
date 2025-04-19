import { PropsWithChildren } from 'react';
import { makeStyles } from '@mui/styles';
import HomeIcon from '@mui/icons-material/Home';
import ExtensionIcon from '@mui/icons-material/Extension';
import MapIcon from '@mui/icons-material/Map';
import LibraryBooks from '@mui/icons-material/LibraryBooks';
import CreateComponentIcon from '@mui/icons-material/Create';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import LogoFull from './LogoFull';
import LogoIcon from './LogoIcon';
import {
  Settings as SidebarSettings,
  UserSettingsSignInAvatar,
} from '@backstage/plugin-user-settings';
import { SidebarSearchModal } from '@backstage/plugin-search';
import {
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
  useSidebarOpenState,
  Link,
} from '@backstage/core-components';
import { IconComponent } from '@backstage/core-plugin-api';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 24,
  },
});

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();

  return (
    <div className={classes.root}>
      <Link to="/" underline="none" className={classes.link} aria-label="Home">
        {isOpen ? <LogoFull /> : <LogoIcon />}
      </Link>
    </div>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      <SidebarLogo />
      <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
        <SidebarSearchModal />
      </SidebarGroup>
      <SidebarDivider />
      <SidebarGroup label="Menu" icon={<MenuIcon />}>
        {/* Global nav, not org-specific */}
        <SidebarItem
          icon={HomeIcon as IconComponent}
          to="catalog"
          text="Home"
        />
        <SidebarItem
          icon={FormatPaintIcon as IconComponent}
          to="renovate"
          text="Renovate"
        />
        <SidebarItem
          icon={ExtensionIcon as IconComponent}
          to="api-docs"
          text="APIs"
        />
        <SidebarItem
          icon={LibraryBooks as IconComponent}
          to="docs"
          text="Docs"
        />
        <SidebarItem
          icon={CreateComponentIcon as IconComponent}
          to="create"
          text="Create..."
        />
        {/* End global nav */}
        <SidebarDivider />
        <SidebarScrollWrapper>
          <SidebarItem
            icon={MapIcon as IconComponent}
            to="tech-radar"
            text="Tech Radar"
          />
        </SidebarScrollWrapper>
      </SidebarGroup>
      <SidebarSpace />
      <SidebarDivider />
      <SidebarGroup
        label="Settings"
        icon={<UserSettingsSignInAvatar />}
        to="/settings"
      >
        <SidebarSettings />
      </SidebarGroup>
    </Sidebar>
    {children}
  </SidebarPage>
);
