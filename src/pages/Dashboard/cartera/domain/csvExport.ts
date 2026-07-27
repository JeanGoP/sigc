const CSV_DELIMITER = ";";

/**
 * Formatea un valor crudo devuelto por la DB para el CSV.
 * - Los strings se recortan (CODICTA viene con espacios de relleno).
 * - Los números enteros se muestran sin decimales; los demás sin ceros
 *   sobrantes al final (1222397513.9000 -> "1222397513.9").
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "";
    }
    if (Number.isInteger(value)) {
      return String(value);
    }
    return String(Number(value.toFixed(4)));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    // Cadenas puramente numéricas (con ceros de relleno tipo "1109891009.0000").
    if (trimmed !== "" && /^-?\d+(\.\d+)?$/.test(trimmed)) {
      const asNumber = Number(trimmed);
      if (Number.isFinite(asNumber)) {
        return Number.isInteger(asNumber)
          ? String(asNumber)
          : String(Number(asNumber.toFixed(4)));
      }
    }
    return trimmed;
  }

  return String(value);
}

/** Escapa un valor para CSV (comillas, delimitador o saltos de línea). */
function escapeCsvValue(value: string): string {
  if (
    value.includes(CSV_DELIMITER) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Construye el contenido CSV a partir de las filas crudas de la DB.
 * Mantiene todas las columnas en el orden en que llegan y aplica una
 * limpieza mínima de valores. Devuelve cadena vacía si no hay filas.
 */
export function buildCarteraCsv(rows: Record<string, unknown>[]): string {
  if (!rows || rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]).map((key) => key.trim());
  const originalKeys = Object.keys(rows[0]);

  const headerLine = headers.map(escapeCsvValue).join(CSV_DELIMITER);

  const dataLines = rows.map((row) =>
    originalKeys
      .map((key) => escapeCsvValue(formatCellValue(row[key])))
      .join(CSV_DELIMITER),
  );

  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Genera y descarga el CSV del dataset de cartera.
 * Incluye BOM UTF-8 para que Excel respete acentos y caracteres especiales.
 */
export function downloadCarteraCsv(
  rows: Record<string, unknown>[],
  fecha: string | null,
): void {
  const csv = buildCarteraCsv(rows);
  if (!csv) {
    return;
  }

  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `dashboard_cartera_${fecha ?? "dataset"}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
