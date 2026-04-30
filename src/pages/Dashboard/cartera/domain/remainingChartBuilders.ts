import type { CarteraRow } from "@app/Data/dashboardCarteraData";

export type DashboardAgingMode = "valor" | "cantidad";
export type DashboardComposicionPorCarteraMode = "valor" | "porcentaje";

const AGE_COLORS = {
  pv: "#28B463",
  d30: "#D4AC0D",
  d60: "#D68910",
  d90: "#CA6F1E",
  d90mas: "#BA4A00",
};

const CONCENTRACION_COLORS = [
  "#4f86c6",
  "#6ab187",
  "#f0ad4e",
  "#e67e22",
  "#d9534f",
  "#8e44ad",
  "#16a085",
  "#2980b9",
  "#c0392b",
  "#d35400",
  "#95a5a6",
];

export function buildConcentracionCarteraChartData(rows: CarteraRow[]) {
  const sortedRows = [...rows].sort((rowA, rowB) => rowB.total - rowA.total);
  const topRows = sortedRows.slice(0, 10);
  const othersTotal = sortedRows
    .slice(10)
    .reduce((sum, row) => sum + row.total, 0);

  return {
    labels: [...topRows.map((row) => row.desccta), "Otras"],
    datasets: [
      {
        data: [...topRows.map((row) => row.total), othersTotal],
        backgroundColor: CONCENTRACION_COLORS,
        borderWidth: 0,
      },
    ],
  };
}

export function buildEficienciaRecuperacionChartData(rows: CarteraRow[]) {
  const visibleRows = rows.filter(
    (row) => row.carteraVencida > 0 && row.recaudoMesActual > 0,
  );

  return {
    datasets: [
      {
        label: "Carteras",
        data: visibleRows.map((row) => ({
          x: row.carteraVencida / 1_000_000,
          y: row.recaudoMesActual / 1_000_000,
          label: row.desccta,
        })),
        backgroundColor: "#4f86c6cc",
        pointRadius: 7,
        pointHoverRadius: 9,
      },
    ],
  };
}

type ComposicionRecaudoPorCarteraRow = CarteraRow & { totalRec: number };

function buildComposicionRecaudoPorCarteraRows(
  rows: CarteraRow[],
): ComposicionRecaudoPorCarteraRow[] {
  const preparedRows = [...rows]
    .map((row) => {
      const totalRec =
        row.recaudoPV +
        row.recaudo30 +
        row.recaudo60 +
        row.recaudo90 +
        row.recaudo90mas;

      if (totalRec === 0) {
        return null;
      }

      return { ...row, totalRec };
    })
    .filter(Boolean) as ComposicionRecaudoPorCarteraRow[];

  return preparedRows.sort(
    (rowA, rowB) =>
      rowB.recaudo90mas / rowB.totalRec - rowA.recaudo90mas / rowA.totalRec,
  );
}

function composeRecaudoValue(
  row: ComposicionRecaudoPorCarteraRow,
  value: number,
  mode: DashboardComposicionPorCarteraMode,
): number {
  return mode === "porcentaje" ? (value / row.totalRec) * 100 : value;
}

export function buildComposicionRecaudoPorCarteraChartData(
  rows: CarteraRow[],
  hiddenCodictas: ReadonlySet<string>,
  mode: DashboardComposicionPorCarteraMode,
) {
  const chipRows = buildComposicionRecaudoPorCarteraRows(rows);
  const visibleRows = chipRows.filter((row) => !hiddenCodictas.has(row.codicta));

  return {
    chipRows,
    rowCount: visibleRows.length,
    labels: visibleRows.map((row) => row.desccta),
    datasets: [
      {
        label: "Por vencer",
        data: visibleRows.map((row) => composeRecaudoValue(row, row.recaudoPV, mode)),
        backgroundColor: AGE_COLORS.pv,
        borderRadius: 0,
      },
      {
        label: "30 dias",
        data: visibleRows.map((row) => composeRecaudoValue(row, row.recaudo30, mode)),
        backgroundColor: AGE_COLORS.d30,
        borderRadius: 0,
      },
      {
        label: "60 dias",
        data: visibleRows.map((row) => composeRecaudoValue(row, row.recaudo60, mode)),
        backgroundColor: AGE_COLORS.d60,
        borderRadius: 0,
      },
      {
        label: "90 dias",
        data: visibleRows.map((row) => composeRecaudoValue(row, row.recaudo90, mode)),
        backgroundColor: AGE_COLORS.d90,
        borderRadius: 0,
      },
      {
        label: "+90 dias",
        data: visibleRows.map((row) => composeRecaudoValue(row, row.recaudo90mas, mode)),
        backgroundColor: AGE_COLORS.d90mas,
        borderRadius: 0,
      },
    ],
  };
}

export function buildMixedRecaudoIndiceChartData(
  rows: CarteraRow[],
  hiddenCodictas: ReadonlySet<string>,
) {
  const chipRows = [...rows].filter(
    (row) => row.recaudoMesActual > 0 && row.indiceRecaudo > 0,
  );
  const visibleRows = chipRows
    .filter((row) => !hiddenCodictas.has(row.codicta))
    .sort((rowA, rowB) => rowB.recaudoMesActual - rowA.recaudoMesActual);

  return {
    chipRows,
    labels: visibleRows.map((row) => row.desccta),
    datasets: [
      {
        type: "bar" as const,
        label: "Recaudo mes actual",
        data: visibleRows.map((row) => row.recaudoMesActual),
        backgroundColor: "#4f86c6bb",
        borderRadius: 3,
        yAxisID: "yRecaudo",
      },
      {
        type: "line" as const,
        label: "Indice de recaudo %",
        data: visibleRows.map((row) => row.indiceRecaudo),
        borderColor: "#d9534f",
        backgroundColor: "transparent",
        pointBackgroundColor: "#d9534f",
        pointRadius: 4,
        tension: 0.3,
        yAxisID: "yIndice",
      },
    ],
  };
}

function getCarteraVencidaColor(value: number, threshold: number): string {
  if (value >= 50) {
    return "#BA4A00";
  }
  if (value >= threshold) {
    return "#CA6F1E";
  }
  if (value >= 8) {
    return "#D68910";
  }
  return "#28B463";
}

export function buildCarteraVencidaChartData(
  rows: CarteraRow[],
  hiddenCodictas: ReadonlySet<string>,
  threshold: number,
) {
  const visibleRows = [...rows]
    .filter((row) => !hiddenCodictas.has(row.codicta))
    .sort((rowA, rowB) => rowB.carteraVencidaPorc - rowA.carteraVencidaPorc);

  return {
    chipRows: rows,
    rowCount: visibleRows.length,
    labels: visibleRows.map((row) => row.desccta),
    datasets: [
      {
        label: "% Cartera vencida",
        data: visibleRows.map((row) => row.carteraVencidaPorc),
        backgroundColor: visibleRows.map((row) =>
          getCarteraVencidaColor(row.carteraVencidaPorc, threshold),
        ),
        borderRadius: 3,
      },
    ],
  };
}

export function buildAgingChartData(
  rows: CarteraRow[],
  hiddenCodictas: ReadonlySet<string>,
  mode: DashboardAgingMode,
) {
  const chipRows = [...rows].filter((row) =>
    mode === "cantidad" ? row.obligacionesTotal > 0 : row.total > 0,
  );
  const visibleRows = chipRows
    .filter((row) => !hiddenCodictas.has(row.codicta))
    .sort((rowA, rowB) =>
      mode === "valor"
        ? rowB.total - rowA.total
        : rowB.obligacionesTotal - rowA.obligacionesTotal,
    );

  return {
    chipRows,
    rowCount: visibleRows.length,
    labels: visibleRows.map((row) => row.desccta),
    datasets:
      mode === "valor"
        ? [
            {
              label: "Por vencer",
              data: visibleRows.map((row) => row.pv),
              backgroundColor: AGE_COLORS.pv,
            },
            {
              label: "30 dias",
              data: visibleRows.map((row) => row.d30),
              backgroundColor: AGE_COLORS.d30,
            },
            {
              label: "60 dias",
              data: visibleRows.map((row) => row.d60),
              backgroundColor: AGE_COLORS.d60,
            },
            {
              label: "90 dias",
              data: visibleRows.map((row) => row.d90),
              backgroundColor: AGE_COLORS.d90,
            },
            {
              label: "+90 dias",
              data: visibleRows.map((row) => row.d90mas),
              backgroundColor: AGE_COLORS.d90mas,
            },
          ]
        : [
            {
              label: "Por vencer",
              data: visibleRows.map((row) => row.obligacionesPV),
              backgroundColor: AGE_COLORS.pv,
            },
            {
              label: "30 dias",
              data: visibleRows.map((row) => row.obligaciones30),
              backgroundColor: AGE_COLORS.d30,
            },
            {
              label: "60 dias",
              data: visibleRows.map((row) => row.obligaciones60),
              backgroundColor: AGE_COLORS.d60,
            },
            {
              label: "90 dias",
              data: visibleRows.map((row) => row.obligaciones90),
              backgroundColor: AGE_COLORS.d90,
            },
            {
              label: "+90 dias",
              data: visibleRows.map((row) => row.obligaciones90mas),
              backgroundColor: AGE_COLORS.d90mas,
            },
          ],
  };
}
