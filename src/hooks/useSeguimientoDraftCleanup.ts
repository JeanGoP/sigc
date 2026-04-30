import { useEffect } from "react";

export const SEGUIMIENTO_DRAFT_PREFIX = "sigc.gestion.seguimiento-draft:";
export const SEGUIMIENTO_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type SeguimientoDraftStorage = Pick<Storage, "getItem" | "removeItem">;

export function cleanupExpiredSeguimientoDrafts(
  storage: SeguimientoDraftStorage | null =
    typeof localStorage === "undefined" ? null : localStorage,
  now = Date.now()
): void {
  if (!storage) {
    return;
  }

  try {
    Object.keys(storage as unknown as Record<string, string>)
      .filter((key) => key.startsWith(SEGUIMIENTO_DRAFT_PREFIX))
      .forEach((key) => {
        try {
          const parsed = JSON.parse(storage.getItem(key) ?? "{}");
          const age = now - new Date(parsed.updatedAt ?? 0).getTime();
          if (age > SEGUIMIENTO_DRAFT_MAX_AGE_MS) {
            storage.removeItem(key);
          }
        } catch {
          storage.removeItem(key);
        }
      });
  } catch {
    // Ignore unavailable storage.
  }
}

export function useSeguimientoDraftCleanup(): void {
  useEffect(() => {
    cleanupExpiredSeguimientoDrafts();
  }, []);
}
