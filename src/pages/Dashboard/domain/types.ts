import type { ComponentType } from "react";

export interface DashboardBoardDefinition {
  key: string;
  label: string;
  icon: string;
  permission: string | null;
  component: ComponentType;
}
