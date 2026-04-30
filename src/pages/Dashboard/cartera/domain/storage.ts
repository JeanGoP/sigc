import type { CarteraRow } from "@app/Data/dashboardCarteraData";

export const DASHBOARD_CARTERA_STORAGE_KEY = "dashboard_cartera_dataset";

export interface PersistedDashboardCarteraDataset {
  fecha: string;
  data: CarteraRow[];
}

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

export function parseDashboardCarteraDataset(
  raw: string | null,
): PersistedDashboardCarteraDataset | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedDashboardCarteraDataset>;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.fecha !== "string" ||
      !Array.isArray(parsed.data)
    ) {
      return null;
    }

    return {
      fecha: parsed.fecha,
      data: parsed.data as CarteraRow[],
    };
  } catch {
    return null;
  }
}

export function loadDashboardCarteraDataset(
  storage: StorageReader = localStorage,
): PersistedDashboardCarteraDataset | null {
  try {
    return parseDashboardCarteraDataset(
      storage.getItem(DASHBOARD_CARTERA_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

export function saveDashboardCarteraDataset(
  dataset: PersistedDashboardCarteraDataset,
  storage: StorageWriter = localStorage,
): void {
  try {
    storage.setItem(DASHBOARD_CARTERA_STORAGE_KEY, JSON.stringify(dataset));
  } catch {
    // ignore storage write errors
  }
}
