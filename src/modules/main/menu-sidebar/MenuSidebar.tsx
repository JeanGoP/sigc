import { Link } from 'react-router-dom';
import { MenuItem } from '@components';
import { Image } from '@profabric/react-components';
import styled from 'styled-components';
import { SidebarSearch } from '@app/components/sidebar-search/SidebarSearch';
import i18n from '@app/utils/i18n';
import { useAppSelector } from '@app/store/store';

export interface IMenuItem {
  name: string;
  icon?: string;
  path?: string;
  children?: Array<IMenuItem>;
}

export const MENU: IMenuItem[] = [
  {
    name: i18n.t('menusidebar.label.dashboard'),
    icon: 'fas fa-tachometer-alt nav-icon',
    path: '/',
  },
  {
    name: i18n.t('menusidebar.label.blank'),
    icon: 'fas fa-wrench nav-icon',
    path: '/blank',
  },
  {
    name: "Consulta por Cliente",
    icon: 'fas fa-wrench nav-icon',
    path: '/consulta_clientes',
  },
  {
    name: "Consulta por Carteras",
    icon: 'fas fa-wrench nav-icon',
    path: '/consulta_carteras',
  },
  {
    name: "Parámetros Generales",
    icon: 'fas fa-cogs nav-icon',
    path: '/parametros_generales',
  },
  {
    name: "Maestros",
    icon: 'fas fa-book nav-icon',
    children: [
      {
        name: "Tipos de eventos",
        icon: 'fas fa-calendar-alt nav-icon',
        path: '/tipos_eventos',
      },
      {
        name: "Tipos de gestiones",
        icon: 'fas fa-calendar-alt nav-icon',
        path: '/tipos_gestiones',
      },
      {
        name: "Equitas de Clientes",
        icon: 'fas fa-calendar-alt nav-icon',
        path: '/etiquetas_clientes',
      },
    ],
  },
  {
    name: i18n.t('menusidebar.label.mainMenu'),
    icon: 'far fa-caret-square-down nav-icon',
    children: [
      {
        name: i18n.t('menusidebar.label.subMenu'),
        icon: 'fas fa-hammer nav-icon',
        path: '/sub-menu-1',
      },

      {
        name: i18n.t('menusidebar.label.blank'),
        icon: 'fas fa-cogs nav-icon',
        path: '/sub-menu-2',
      },
    ],
  },
  {
    name: "Monitor de seguimientos",
    icon: 'fas fa-list nav-icon',
    path: '/monitor_seguimientos',
  },
  {
    name: "Monitor de Asesores",
    icon: 'fas fa-tasks nav-icon',
    path: '/rendimiento_asesores',
  },
  {
    name: "Campañas",
    icon: 'fas fa-bullhorn nav-icon',
    path: '/campanas',
  },
  {
    name: "Calendario",
    icon: 'fas fa-calendar-alt nav-icon',
    path: '/calendario',
  },
];

const StyledBrandImage = styled(Image)`
  float: left;
  line-height: 0.8;
  margin: -1px 8px 0 6px;
  opacity: 0.8;
  --pf-box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19),
    0 6px 6px rgba(0, 0, 0, 0.23) !important;
`;

const StyledUserImage = styled(Image)`
  --pf-box-shadow: 0 3px 6px #00000029, 0 3px 6px #0000003b !important;
`;

const MenuSidebar = () => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const sidebarSkin = useAppSelector((state) => state.ui.sidebarSkin);
  const menuItemFlat = useAppSelector((state) => state.ui.menuItemFlat);
  const menuChildIndent = useAppSelector((state) => state.ui.menuChildIndent);

  return (
    <aside className={`main-sidebar elevation-4 ${sidebarSkin}`} style={{position: 'fixed', height: '100vh'}}>
      <Link to="/" className="brand-link">
        <StyledBrandImage
          src="\logoinversionesmotosycarros.png"
          alt="AdminLTE Logo"
          width={33}
          height={33}
          rounded
        />
        <span className="brand-text font-weight-light">SIGC</span>
      </Link>
      <div className="sidebar">
        <div className="user-panel mt-3 pb-3 mb-3 d-flex">
          <div className="image">
            <StyledUserImage
              src="\user-solid.svg"
              fallbackSrc="/img/default-profile.png"
              alt="User"
              width={34}
              height={34}
              rounded
            />
          </div>
          <div className="info">
            <Link to={'/profile'} className="d-block">
              {currentUser?.email}
            </Link>
          </div>
        </div>

        <div className="form-inline">
          <SidebarSearch />
        </div>

        <nav className="mt-2" style={{ overflowY: 'hidden' }}>
          <ul
            className={`nav nav-pills nav-sidebar flex-column${
              menuItemFlat ? ' nav-flat' : ''
            }${menuChildIndent ? ' nav-child-indent' : ''}`}
            role="menu"
          >
            {MENU.map((menuItem: IMenuItem) => (
              <MenuItem
                key={menuItem.name + menuItem.path}
                menuItem={menuItem}
              />
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default MenuSidebar;
