const CSV_DELIMITER = ";";

/**
 * Columnas del CSV en orden explícito, con su etiqueta legible.
 *
 * IMPORTANTE: el orden se define aquí como un array (NO se deriva de
 * Object.keys de la respuesta), porque JavaScript reordena las claves con
 * forma de entero ("30", "60", "90") al inicio del objeto, rompiendo el orden
 * original de la DB. `key` es el nombre de columna tal cual llega de la DB.
 * Solo aplica al CSV descargado; los datos y el resto de la app usan los
 * nombres crudos.
 */
const CSV_COLUMNS: { key: string; label: string }[] = [
  { key: "CODICTA", label: "Código cuenta" },
  { key: "DESCCTA", label: "Nombre cuenta" },

  { key: "Obligaciones_Total", label: "Obligaciones - Total" },
  { key: "Obligaciones_PV", label: "Obligaciones - Por vencer" },
  { key: "Obligaciones_30", label: "Obligaciones - 30 días" },
  { key: "Obligaciones_60", label: "Obligaciones - 60 días" },
  { key: "Obligaciones_90", label: "Obligaciones - 90 días" },
  { key: "Obligaciones_90_MAS", label: "Obligaciones - +90 días" },

  { key: "total", label: "Saldo total" },
  { key: "PV", label: "Saldo por vencer" },
  { key: "30", label: "Saldo 30 días" },
  { key: "60", label: "Saldo 60 días" },
  { key: "90", label: "Saldo 90 días" },
  { key: "+90", label: "Saldo +90 días" },
  { key: "CarteraVencida", label: "Cartera vencida" },

  { key: "PV_Porc", label: "% Por vencer" },
  { key: "30_Porc", label: "% 30 días" },
  { key: "60_Porc", label: "% 60 días" },
  { key: "90_Porc", label: "% 90 días" },
  { key: "+90_Porc", label: "% +90 días" },
  { key: "CarteraVencida_Porc", label: "% Cartera vencida" },

  { key: "total_Ant", label: "Saldo total (mes anterior)" },
  { key: "PV_Ant", label: "Saldo por vencer (mes anterior)" },
  { key: "30_Ant", label: "Saldo 30 días (mes anterior)" },
  { key: "60_Ant", label: "Saldo 60 días (mes anterior)" },
  { key: "90_Ant", label: "Saldo 90 días (mes anterior)" },
  { key: "+90_Ant", label: "Saldo +90 días (mes anterior)" },
  { key: "CarteraVencida_Ant", label: "Cartera vencida (mes anterior)" },

  { key: "PV_Ant_Porc", label: "% Por vencer (mes anterior)" },
  { key: "30_Ant_Porc", label: "% 30 días (mes anterior)" },
  { key: "60_Ant_Porc", label: "% 60 días (mes anterior)" },
  { key: "90_Ant_Porc", label: "% 90 días (mes anterior)" },
  { key: "+90_Ant_Porc", label: "% +90 días (mes anterior)" },
  { key: "CarteraVencida_Ant_Porc", label: "% Cartera vencida (mes anterior)" },

  { key: "TotalRecaudoMesActual", label: "Recaudo mes actual" },
  { key: "TotalRecaudoMesAnterior", label: "Recaudo mes anterior" },
  { key: "Diferencia", label: "Diferencia recaudo" },
  { key: "PorcentajeVariacion", label: "% Variación recaudo" },
  { key: "IndiceRecaudo_Porc", label: "Índice de recaudo (%)" },

  { key: "RecaudoMesActual_PV", label: "Recaudo - Por vencer" },
  { key: "RecaudoMesActual_30", label: "Recaudo - 30 días" },
  { key: "RecaudoMesActual_60", label: "Recaudo - 60 días" },
  { key: "RecaudoMesActual_90", label: "Recaudo - 90 días" },
  { key: "RecaudoMesActual_90_MAS", label: "Recaudo - +90 días" },
  { key: "RecaudoMesActual_SinEdad", label: "Recaudo - Sin edad" },
  { key: "RecaudoMesActual_Vencido", label: "Recaudo - Vencido" },

  { key: "RecaudoMesActual_PV_Porc", label: "% Recaudo por vencer" },
  { key: "RecaudoMesActual_30_Porc", label: "% Recaudo 30 días" },
  { key: "RecaudoMesActual_60_Porc", label: "% Recaudo 60 días" },
  { key: "RecaudoMesActual_90_Porc", label: "% Recaudo 90 días" },
  { key: "RecaudoMesActual_90_MAS_Porc", label: "% Recaudo +90 días" },
  { key: "RecaudoMesActual_SinEdad_Porc", label: "% Recaudo sin edad" },
  { key: "RecaudoMesActual_Vencido_Porc", label: "% Recaudo vencido" },
];

/**
 * Devuelve las columnas a exportar en orden: primero las definidas en
 * CSV_COLUMNS (las presentes en la fila), y luego cualquier columna extra que
 * la DB haya devuelto pero no esté mapeada (usando su nombre crudo).
 */
function resolveColumns(
  sampleRow: Record<string, unknown>,
): { key: string; label: string }[] {
  const knownKeys = new Set(CSV_COLUMNS.map((column) => column.key));
  const ordered = CSV_COLUMNS.filter((column) => column.key in sampleRow);
  const extras = Object.keys(sampleRow)
    .filter((key) => !knownKeys.has(key))
    .map((key) => ({ key, label: key.trim() }));

  return [...ordered, ...extras];
}

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
 * El orden de columnas se toma de CSV_COLUMNS (orden explícito), no del
 * orden de las claves de la respuesta. Aplica una limpieza mínima de
 * valores. Devuelve cadena vacía si no hay filas.
 */
export function buildCarteraCsv(rows: Record<string, unknown>[]): string {
  if (!rows || rows.length === 0) {
    return "";
  }

  const columns = resolveColumns(rows[0]);

  const headerLine = columns
    .map((column) => escapeCsvValue(column.label))
    .join(CSV_DELIMITER);

  const dataLines = rows.map((row) =>
    columns
      .map((column) => escapeCsvValue(formatCellValue(row[column.key])))
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
