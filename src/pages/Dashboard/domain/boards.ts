import CarteraBoard from "../CarteraBoard";
import InicioBoard from "../InicioBoard";
import type { DashboardBoardDefinition } from "./types";

export const DASHBOARD_ACCENT_COLOR = "#4f86c6";

export const DASHBOARD_BOARDS: DashboardBoardDefinition[] = [
  {
    key: "inicio",
    label: "Inicio",
    icon: "fas fa-home",
    permission: null,
    component: InicioBoard,
  },
  {
    key: "cartera",
    label: "Cartera",
    icon: "fas fa-wallet",
    permission: "dashboard.cartera",
    component: CarteraBoard,
  },
];
