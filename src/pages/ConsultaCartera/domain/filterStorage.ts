import { FiltrosFacturasCarteraModel } from "../../../models/otros/FiltrosFacturasCarteraModel";

export const CONSULTA_CARTERA_FILTERS_STORAGE_KEY = "filtros_carteras";

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem" | "removeItem">;
type StorageLike = StorageReader & Partial<StorageWriter>;

export type ConsultaCarteraStoredFilters =
  Partial<FiltrosFacturasCarteraModel> & Record<string, unknown>;

function getStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) {
    return storage;
  }

  return typeof sessionStorage === "undefined" ? null : sessionStorage;
}

function isStoredFiltersRecord(value: unknown): value is ConsultaCarteraStoredFilters {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseConsultaCarteraStoredFilters(
  raw: string | null
): ConsultaCarteraStoredFilters | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return isStoredFiltersRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function hasConsultaCarteraStoredFilters(storage?: StorageLike | null): boolean {
  return getStorage(storage)?.getItem(CONSULTA_CARTERA_FILTERS_STORAGE_KEY) !== null;
}

export function loadConsultaCarteraStoredFilters(
  storage?: StorageLike | null
): ConsultaCarteraStoredFilters | null {
  return parseConsultaCarteraStoredFilters(
    getStorage(storage)?.getItem(CONSULTA_CARTERA_FILTERS_STORAGE_KEY) ?? null
  );
}

export function loadConsultaCarteraFilters(
  storage?: StorageLike | null
): FiltrosFacturasCarteraModel {
  const stored = loadConsultaCarteraStoredFilters(storage);
  return new FiltrosFacturasCarteraModel(stored ?? undefined);
}

export function saveConsultaCarteraFilters(
  filters: ConsultaCarteraStoredFilters | FiltrosFacturasCarteraModel,
  storage?: StorageLike | null
): void {
  getStorage(storage)?.setItem?.(
    CONSULTA_CARTERA_FILTERS_STORAGE_KEY,
    JSON.stringify(filters)
  );
}

export function clearConsultaCarteraFilters(storage?: StorageLike | null): void {
  getStorage(storage)?.removeItem?.(CONSULTA_CARTERA_FILTERS_STORAGE_KEY);
}

export function ensureConsultaCarteraFilters(
  storage?: StorageLike | null
): FiltrosFacturasCarteraModel {
  const existing = loadConsultaCarteraStoredFilters(storage);
  if (existing) {
    return new FiltrosFacturasCarteraModel(existing);
  }

  const defaults = new FiltrosFacturasCarteraModel();
  saveConsultaCarteraFilters(defaults, storage);
  return defaults;
}

export function updateConsultaCarteraFilterProperty(
  key: string,
  value: unknown,
  storage?: StorageLike | null
): void {
  const current = loadConsultaCarteraStoredFilters(storage) ?? {};
  saveConsultaCarteraFilters(
    {
      ...current,
      [key]: value,
    },
    storage
  );
}
