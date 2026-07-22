import { createSlice } from "@reduxjs/toolkit";

export interface SecurityMenuItem {
  menuId: number;
  menuKey: string;
  menuName: string;
  menuPath?: string | null;
  menuParentId?: number | null;
  parentMenuKey?: string | null;
  iconClass?: string | null;
  sortOrder: number;
  children: SecurityMenuItem[];
}

export interface SecurityState {
  menuTree: SecurityMenuItem[];
  permissions: string[];
  reportesPermitidos: string[]; // Códigos de reportes permitidos
  loaded: boolean;
}

const initialState: SecurityState = {
  menuTree: [],
  permissions: [],
  reportesPermitidos: [],
  loaded: false,
};

export const securitySlice = createSlice({
  name: "security",
  initialState,
  reducers: {
    setSecurityData: (
      state,
      {
        payload,
      }: {
        payload: {
          menuTree: SecurityMenuItem[];
          permissions: string[];
          reportesPermitidos?: string[];
        };
      }
    ) => {
      state.menuTree = payload.menuTree ?? [];
      state.permissions = payload.permissions ?? [];
      state.reportesPermitidos = payload.reportesPermitidos ?? [];
      state.loaded = true;
    },
    clearSecurity: (state) => {
      state.menuTree = [];
      state.permissions = [];
      state.reportesPermitidos = [];
      state.loaded = false;
    },
  },
});

export const { setSecurityData, clearSecurity } = securitySlice.actions;

export default securitySlice.reducer;
