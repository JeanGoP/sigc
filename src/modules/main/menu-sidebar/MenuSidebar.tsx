import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MenuItem } from "@components";
import { Image } from "@profabric/react-components";
import styled from "styled-components";
import { SidebarSearch } from "@app/components/sidebar-search/SidebarSearch";
import { useAppSelector } from "@app/store/store";
import { SecurityMenuItem } from "@app/store/reducers/security";

export interface IMenuItem {
  name: string;
  icon?: string;
  path?: string;
  children?: Array<IMenuItem>;
}

export const mapSecurityMenuToMenuItems = (
  menuTree: SecurityMenuItem[]
): IMenuItem[] => {
  const hiddenMenuKeys = new Set([
    "llamadas_webrtc",
    "monitor_seguimientos",
    "campanas",
  ]);
  const hiddenMenuPaths = new Set(["/monitor_seguimientos", "/campanas"]);

  const mapNode = (node: SecurityMenuItem): IMenuItem | null => {
    const normalizedMenuKey = String(node.menuKey ?? "").trim().toLowerCase();
    const normalizedMenuPath = String(node.menuPath ?? "").trim().toLowerCase();

    if (
      hiddenMenuKeys.has(normalizedMenuKey) ||
      hiddenMenuPaths.has(normalizedMenuPath)
    ) {
      return null;
    }

    const children = node.children && node.children.length > 0
      ? node.children
        .map(mapNode)
        .filter((child): child is IMenuItem => child !== null)
      : undefined;

    const hasChildren = Boolean(children && children.length > 0);
    const hasPath = Boolean(String(node.menuPath ?? "").trim());
    if (!hasChildren && !hasPath && normalizedMenuKey) {
      return null;
    }

    return {
      name: node.menuName,
      icon: node.iconClass || "far fa-circle nav-icon",
      path: node.menuPath || undefined,
      children: hasChildren ? children : undefined,
    };
  };

  return menuTree
    .map(mapNode)
    .filter((item): item is IMenuItem => item !== null);
};

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
  const menuTree = useAppSelector((state) => state.security.menuTree);

  const menuItems = useMemo(() => mapSecurityMenuToMenuItems(menuTree), [menuTree]);

  return (
    <aside
      className={`main-sidebar elevation-4 ${sidebarSkin}`}
      style={{ position: "fixed", height: "100vh" }}
    >
      <Link to="/" className="brand-link">
        <StyledBrandImage
          src="\logoEmpresa.svg"
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
            <Link to={"/profile"} className="d-block">
              {currentUser?.email}
            </Link>
          </div>
        </div>

        <div className="form-inline">
          <SidebarSearch />
        </div>

        <nav className="mt-2" style={{ overflowY: "hidden" }}>
          <ul
            className={`nav nav-pills nav-sidebar flex-column${
              menuItemFlat ? " nav-flat" : ""
            }${menuChildIndent ? " nav-child-indent" : ""}`}
            role="menu"
          >
            {menuItems.map((menuItem: IMenuItem) => (
              <MenuItem key={menuItem.name + menuItem.path} menuItem={menuItem} />
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default MenuSidebar;
