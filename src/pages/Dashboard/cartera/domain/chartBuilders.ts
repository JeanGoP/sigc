import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import {
  DASHBOARD_AGE_COLORS as SHARED_DASHBOARD_AGE_COLORS,
  DASHBOARD_AGE_LABELS as SHARED_DASHBOARD_AGE_LABELS,
} from "@app/constants/ageBuckets";

export type RecaudoChartMode = "valor" | "variacion";
export type ComposicionRecaudoMode = "valor" | "porcentaje";

export const DASHBOARD_CARTERA_AGE_LABELS = SHARED_DASHBOARD_AGE_LABELS;

export const DASHBOARD_CARTERA_AGE_COLORS = SHARED_DASHBOARD_AGE_COLORS;

export function toggleHiddenDashboardCartera(
  current: ReadonlySet<string>,
  codicta: string,
): Set<string> {
  const next = new Set(current);

  if (next.has(codicta)) {
    next.delete(codicta);
  } else {
    next.add(codicta);
  }

  return next;
}

export function buildDistribucionSaldoChartData(
  rows: CarteraRow[],
  hiddenCodictas: ReadonlySet<string>,
) {
  const visibleRows = rows.filter((row) => !hiddenCodictas.has(row.codicta));

  return {
    chipRows: rows,
    labels: DASHBOARD_CARTERA_AGE_LABELS,
    datasets: [
      {
        data: [
          visibleRows.reduce((sum, row) => sum + row.pv, 0),
          visibleRows.reduce((sum, row) => sum + row.d30, 0),
          visibleRows.reduce((sum, row) => sum + row.d60, 0),
          visibleRows.reduce((sum, row) => sum + row.d90, 0),
          visibleRows.reduce((sum, row) => sum + row.d90mas, 0),
        ],
        backgroundColor: DASHBOARD_CARTERA_AGE_COLORS,
        borderWidth: 0,
      },
    ],
  };
}

export function buildComposicionRecaudoChartData(
  rows: CarteraRow[],
  hiddenCodictas: ReadonlySet<string>,
  mode: ComposicionRecaudoMode,
) {
  const chipRows = rows.filter(
    (row) =>
      row.recaudoPV +
        row.recaudo30 +
        row.recaudo60 +
        row.recaudo90 +
        row.recaudo90mas >
      0,
  );
  const visibleRows = chipRows.filter((row) => !hiddenCodictas.has(row.codicta));
  const values = [
    visibleRows.reduce((sum, row) => sum + row.recaudoPV, 0),
    visibleRows.reduce((sum, row) => sum + row.recaudo30, 0),
    visibleRows.reduce((sum, row) => sum + row.recaudo60, 0),
    visibleRows.reduce((sum, row) => sum + row.recaudo90, 0),
    visibleRows.reduce((sum, row) => sum + row.recaudo90mas, 0),
  ];
  const total = values.reduce((sum, value) => sum + value, 0);
  const chartValues =
    mode === "porcentaje"
      ? values.map((value) => (total > 0 ? (value / total) * 100 : 0))
      : values;

  return {
    chipRows,
    labels: DASHBOARD_CARTERA_AGE_LABELS,
    datasets: [
      {
        data: chartValues,
        backgroundColor: DASHBOARD_CARTERA_AGE_COLORS,
        borderWidth: 0,
      },
    ],
    values,
    total,
  };
}

export function buildIndiceRecaudoChartData(rows: CarteraRow[]) {
  const visibleRows = [...rows]
    .filter((row) => row.indiceRecaudo > 0)
    .sort((a, b) => b.indiceRecaudo - a.indiceRecaudo);

  return {
    rows: visibleRows,
    labels: visibleRows.map((row) => row.desccta),
    datasets: [
      {
        label: "Indice de recaudo %",
        data: visibleRows.map((row) => row.indiceRecaudo),
        backgroundColor: visibleRows.map((row) =>
          row.indiceRecaudo >= 15
            ? "#6ab187"
            : row.indiceRecaudo >= 8
              ? "#4f86c6"
              : "#f0ad4e",
        ),
        borderRadius: 3,
      },
    ],
  };
}

export function buildRecaudoChartData(
  rows: CarteraRow[],
  hiddenCodictas: ReadonlySet<string>,
  mode: RecaudoChartMode,
) {
  const chipRows = [...rows].filter(
    (row) => row.recaudoMesActual > 0 || row.recaudoMesAnterior > 0,
  );
  const visibleRows = chipRows
    .filter((row) => !hiddenCodictas.has(row.codicta))
    .sort((a, b) =>
      mode === "valor"
        ? b.recaudoMesActual - a.recaudoMesActual
        : b.porcentajeVariacion - a.porcentajeVariacion,
    );

  return {
    chipRows,
    labels: visibleRows.map((row) => row.desccta),
    datasets:
      mode === "valor"
        ? [
            {
              label: "Mes actual",
              data: visibleRows.map((row) => row.recaudoMesActual),
              backgroundColor: "#4f86c6",
              borderRadius: 3,
            },
            {
              label: "Mes anterior",
              data: visibleRows.map((row) => row.recaudoMesAnterior),
              backgroundColor: "#bcd2ee",
              borderRadius: 3,
            },
          ]
        : [
            {
              label: "Variacion %",
              data: visibleRows.map((row) => row.porcentajeVariacion),
              backgroundColor: visibleRows.map((row) =>
                row.porcentajeVariacion >= 0 ? "#6ab187" : "#d9534f",
              ),
              borderRadius: 3,
            },
          ],
    rowCount: visibleRows.length,
  };
}
