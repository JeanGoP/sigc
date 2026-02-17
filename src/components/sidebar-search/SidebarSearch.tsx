import { IMenuItem, mapSecurityMenuToMenuItems } from "@app/modules/main/menu-sidebar/MenuSidebar";
import { useAppSelector } from "@app/store/store";
import { Dropdown } from "@profabric/react-components";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

export const StyledDropdown = styled(Dropdown)`
  border: none;
  width: 100%;
  display: flex;
  padding: 0;
  justify-content: center;
  align-items: center;
  --pf-dropdown-menu-min-width: 14.625rem;
  --pf-dropdown-border: none;
  --pf-dropdown-menu-margin-top: 0px;

  .menu {
    background-color: #454d55;
  }

  .dropdown-item {
    padding: 0.5rem 1rem;
  }

  .nothing-found {
    color: #c2c7d0;
    padding: 0.25rem 0.5rem;
  }

  .list-group {
    .list-group-item {
      padding: 0.5rem 0.75rem;
      cursor: pointer;
    }

    .search-path {
      font-size: 80%;
      color: #adb5bd;
    }
  }
`;

export const SidebarSearch = () => {
  const [searchText, setSearchText] = useState("");
  const [foundMenuItems, setFoundMenuItems] = useState<IMenuItem[]>([]);
  const dropdown = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const menuTree = useAppSelector((state) => state.security.menuTree);

  const menuItems = useMemo(() => mapSecurityMenuToMenuItems(menuTree), [menuTree]);

  useEffect(() => {
    if (!searchText.trim()) {
      setFoundMenuItems([]);
      return;
    }

    setFoundMenuItems(findMenuItems(menuItems, searchText.trim().toLowerCase()));
  }, [searchText, menuItems]);

  useEffect(() => {
    setIsDropdownOpen(foundMenuItems.length > 0);
  }, [foundMenuItems]);

  const handleIconClick = () => {
    setSearchText("");
    setIsDropdownOpen(false);
  };

  const handleMenuItemClick = () => {
    setSearchText("");
    setIsDropdownOpen(false);
  };

  const findMenuItems = (
    inputItems: IMenuItem[],
    normalizedSearchText: string,
    results: IMenuItem[] = []
  ): IMenuItem[] => {
    for (const menuItem of inputItems) {
      if (
        menuItem.path &&
        menuItem.name.toLowerCase().includes(normalizedSearchText)
      ) {
        results.push(menuItem);
      }

      if (menuItem.children && menuItem.children.length > 0) {
        findMenuItems(menuItem.children, normalizedSearchText, results);
      }
    }

    return results;
  };

  const boldString = (text: string, search: string) => {
    if (!search) {
      return text;
    }

    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "ig");
    return text.replace(regex, '<strong class="text-light">$1</strong>');
  };

  return (
    <StyledDropdown
      ref={dropdown}
      isOpen={isDropdownOpen}
      hideArrow
      openOnButtonClick={false}
    >
      <div slot="head">
        <div className="input-group">
          <input
            className="form-control form-control-sidebar"
            type="text"
            placeholder="Search"
            aria-label="Search"
            value={searchText}
            onInput={(e: any) => setSearchText(e?.target?.value || "")}
          />
          <div className="input-group-append">
            <button
              type="button"
              className="btn btn-sidebar"
              onClick={() => handleIconClick()}
            >
              <i
                className={`fas ${searchText.length === 0 && "fa-search"} ${
                  searchText.length > 0 && "fa-times"
                } fa-fw`}
              />
            </button>
          </div>
        </div>
      </div>
      <div className="menu" slot="body">
        {searchText.trim() && foundMenuItems.length === 0 && (
          <div className="nothing-found">No element found</div>
        )}
        {foundMenuItems.length > 0 && (
          <div className="list-group">
            {foundMenuItems.map((menuItem) => (
              <NavLink
                key={menuItem.name + menuItem.path}
                className="list-group-item"
                to={menuItem.path || "/"}
                onClick={() => handleMenuItemClick()}
              >
                <div
                  className="search-title"
                  dangerouslySetInnerHTML={{
                    __html: boldString(menuItem.name, searchText),
                  }}
                />
                <div className="search-path">{menuItem.path}</div>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </StyledDropdown>
  );
};
