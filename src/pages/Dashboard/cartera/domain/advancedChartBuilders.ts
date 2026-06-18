import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { DASHBOARD_AGE_COMPARATIVE_COLORS } from "@app/constants/ageBuckets";

export type ComparativoSaldoSortKey = "actual" | "anterior" | "delta";
export type ComparativoAgingViewMode = "distribucion" | "variacion";
export type ComparativoAgingSegment =
  | "total"
  | "pv"
  | "d30"
  | "d60"
  | "d90"
  | "d90mas";

export interface RadarSaludMetricValues {
  saludMora: number;
  indice: number;
  clientesAlDia: number;
  crecimiento: number;
  eficiencia: number;
}

type SegmentColorScale = {
  active: string;
  previous: string;
};

type ComparativoAgingSegmentDefinition = {
  key: ComparativoAgingSegment;
  label: string;
  active: (row: CarteraRow) => number;
  previous: (row: CarteraRow) => number;
};

export const COMPARATIVO_AGING_SEGMENT_COLORS: Record<
  Exclude<ComparativoAgingSegment, "total">,
  SegmentColorScale
> = {
  pv: DASHBOARD_AGE_COMPARATIVE_COLORS.pv,
  d30: DASHBOARD_AGE_COMPARATIVE_COLORS.d30,
  d60: DASHBOARD_AGE_COMPARATIVE_COLORS.d60,
  d90: DASHBOARD_AGE_COMPARATIVE_COLORS.d90,
  d90mas: DASHBOARD_AGE_COMPARATIVE_COLORS.d90mas,
};

export const COMPARATIVO_AGING_SEGMENTS: ComparativoAgingSegmentDefinition[] = [
  {
    key: "total",
    label: "Total",
    active: (row) => row.total,
    previous: (row) => row.totalAnt ?? 0,
  },
  {
    key: "pv",
    label: "PV",
    active: (row) => row.pv,
    previous: (row) => row.pvAnt ?? 0,
  },
  {
    key: "d30",
    label: "30d",
    active: (row) => row.d30,
    previous: (row) => row.d30Ant ?? 0,
  },
  {
    key: "d60",
    label: "60d",
    active: (row) => row.d60,
    previous: (row) => row.d60Ant ?? 0,
  },
  {
    key: "d90",
    label: "90d",
    active: (row) => row.d90,
    previous: (row) => row.d90Ant ?? 0,
  },
  {
    key: "d90mas",
    label: "+90d",
    active: (row) => row.d90mas,
    previous: (row) => row.d90masAnt ?? 0,
  },
];

export const RADAR_SALUD_COLOR_PALETTE = [
  { border: "#4f86c6", background: "#4f86c622" },
  { border: "#6ab187", background: "#6ab18722" },
  { border: "#d9534f", background: "#d9534f22" },
  { border: "#f0ad4e", background: "#f0ad4e22" },
  { border: "#8e44ad", background: "#8e44ad22" },
  { border: "#e67e22", background: "#e67e2222" },
  { border: "#1abc9c", background: "#1abc9c22" },
  { border: "#2c3e50", background: "#2c3e5022" },
];

export const RADAR_SALUD_LABELS = [
  "Salud mora",
  "Indice recaudo",
  "Clientes al dia",
  "Crecimiento recaudo",
  "Eficiencia recuperacion",
];

function normalizeRadarMetric(value: number, min: number, max: number): number {
  if (max === min) {
    return 0;
  }

  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function averageMetricValues(
  rows: CarteraRow[],
  selector: (row: CarteraRow) => number,
): number {
  if (rows.length === 0) {
    return 0;
  }

  return rows.reduce((sum, row) => sum + selector(row), 0) / rows.length;
}

export function calculateDashboardPercentDelta(
  current: number,
  previous: number,
): number {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0;
}

export function buildComparativoSaldoChartData(
  rows: CarteraRow[],
  hiddenCodictas: ReadonlySet<string>,
  sortBy: ComparativoSaldoSortKey,
) {
  const hayAnt = rows.some((row) => (row.totalAnt ?? 0) > 0);
  const visibleRows = [...rows]
    .filter((row) => !hiddenCodictas.has(row.codicta))
    .sort((rowA, rowB) => {
      if (sortBy === "actual") {
        return rowB.total - rowA.total;
      }

      if (sortBy === "anterior") {
        return (rowB.totalAnt ?? 0) - (rowA.totalAnt ?? 0);
      }

      return (
        calculateDashboardPercentDelta(rowB.total, rowB.totalAnt ?? 0) -
        calculateDashboardPercentDelta(rowA.total, rowA.totalAnt ?? 0)
      );
    });

  return {
    hayAnt,
    chipRows: rows,
    rowCount: visibleRows.length,
    labels: visibleRows.map((row) => row.desccta),
    datasets: [
      {
        label: "Saldo actual",
        data: visibleRows.map((row) => row.total),
        backgroundColor: "#4f86c6",
        borderRadius: 3,
        barPercentage: 0.7,
      },
      ...(hayAnt
        ? [
            {
              label: "Saldo anterior",
              data: visibleRows.map((row) => row.totalAnt ?? 0),
              backgroundColor: "#b0bec5",
              borderRadius: 3,
              barPercentage: 0.7,
            },
          ]
        : []),
    ],
  };
}

export function buildComparativoAgingChartData(
  rows: CarteraRow[],
  hiddenCodictas: ReadonlySet<string>,
  segment: ComparativoAgingSegment,
) {
  const hayAnt = rows.some((row) => (row.totalAnt ?? 0) > 0);
  const chipRows = rows.filter((row) => row.total > 0);
  const visibleRows = [...chipRows]
    .filter((row) => !hiddenCodictas.has(row.codicta))
    .sort((rowA, rowB) => rowB.total - rowA.total);
  const activeSegment =
    COMPARATIVO_AGING_SEGMENTS.find((item) => item.key === segment) ??
    COMPARATIVO_AGING_SEGMENTS[0];
  const distribucionDatasets = [
    {
      label: "PV",
      data: visibleRows.map((row) => row.pv),
      stack: "actual",
      backgroundColor: COMPARATIVO_AGING_SEGMENT_COLORS.pv.active,
      borderRadius: 2,
    },
    {
      label: "30d",
      data: visibleRows.map((row) => row.d30),
      stack: "actual",
      backgroundColor: COMPARATIVO_AGING_SEGMENT_COLORS.d30.active,
      borderRadius: 2,
    },
    {
      label: "60d",
      data: visibleRows.map((row) => row.d60),
      stack: "actual",
      backgroundColor: COMPARATIVO_AGING_SEGMENT_COLORS.d60.active,
      borderRadius: 2,
    },
    {
      label: "90d",
      data: visibleRows.map((row) => row.d90),
      stack: "actual",
      backgroundColor: COMPARATIVO_AGING_SEGMENT_COLORS.d90.active,
      borderRadius: 2,
    },
    {
      label: "+90d",
      data: visibleRows.map((row) => row.d90mas),
      stack: "actual",
      backgroundColor: COMPARATIVO_AGING_SEGMENT_COLORS.d90mas.active,
      borderRadius: 2,
    },
    {
      label: "PV ant",
      data: visibleRows.map((row) => row.pvAnt ?? 0),
      stack: "anterior",
      backgroundColor: COMPARATIVO_AGING_SEGMENT_COLORS.pv.previous,
      borderRadius: 2,
    },
    {
      label: "30d ant",
      data: visibleRows.map((row) => row.d30Ant ?? 0),
      stack: "anterior",
      backgroundColor: COMPARATIVO_AGING_SEGMENT_COLORS.d30.previous,
      borderRadius: 2,
    },
    {
      label: "60d ant",
      data: visibleRows.map((row) => row.d60Ant ?? 0),
      stack: "anterior",
      backgroundColor: COMPARATIVO_AGING_SEGMENT_COLORS.d60.previous,
      borderRadius: 2,
    },
    {
      label: "90d ant",
      data: visibleRows.map((row) => row.d90Ant ?? 0),
      stack: "anterior",
      backgroundColor: COMPARATIVO_AGING_SEGMENT_COLORS.d90.previous,
      borderRadius: 2,
    },
    {
      label: "+90d ant",
      data: visibleRows.map((row) => row.d90masAnt ?? 0),
      stack: "anterior",
      backgroundColor: COMPARATIVO_AGING_SEGMENT_COLORS.d90mas.previous,
      borderRadius: 2,
    },
  ];
  const deltaValues = visibleRows.map(
    (row) => activeSegment.active(row) - activeSegment.previous(row),
  );

  return {
    hayAnt,
    chipRows,
    rowCount: visibleRows.length,
    labels: visibleRows.map((row) => row.desccta),
    distribucionDatasets,
    variacionDataset: {
      label: `Delta ${activeSegment.label}`,
      data: deltaValues,
      backgroundColor: deltaValues.map((value) =>
        value >= 0 ? "#28B463" : "#BA4A00",
      ),
      borderRadius: 3,
    },
    activeSegment,
    visibleRows,
  };
}

export function getBubbleRiesgoColor(row: CarteraRow): string {
  if (row.carteraVencidaPorc > 15) {
    return "#d9534f";
  }

  if (row.carteraVencidaPorc > 8) {
    return "#f0ad4e";
  }

  return "#6ab187";
}

export function buildBubbleRiesgoChartData(
  rows: CarteraRow[],
  hiddenCodictas: ReadonlySet<string>,
) {
  const chipRows = rows.filter((row) => row.total > 0 && row.indiceRecaudo > 0);
  const visibleRows = chipRows.filter((row) => !hiddenCodictas.has(row.codicta));
  const maxTotal = Math.max(1, ...chipRows.map((row) => row.total));

  return {
    chipRows,
    datasets: visibleRows.map((row) => ({
      label: row.desccta,
      data: [
        {
          x: row.carteraVencidaPorc,
          y: row.indiceRecaudo,
          r: 5 + (row.total / maxTotal) * 28,
        },
      ],
      backgroundColor: `${getBubbleRiesgoColor(row)}99`,
      borderColor: getBubbleRiesgoColor(row),
      borderWidth: 1.5,
    })),
  };
}

export function buildRadarSaludMetrics(row: CarteraRow): RadarSaludMetricValues {
  return {
    saludMora: Math.max(0, 100 - row.carteraVencidaPorc),
    indice: normalizeRadarMetric(row.indiceRecaudo, 0, 20),
    clientesAlDia:
      row.obligacionesTotal > 0
        ? (row.obligacionesPV / row.obligacionesTotal) * 100
        : 0,
    crecimiento: normalizeRadarMetric(row.porcentajeVariacion, -20, 20),
    eficiencia:
      row.carteraVencida > 0
        ? Math.min(100, (row.recaudoVencido / row.carteraVencida) * 100)
        : 100,
  };
}

export function buildRadarSaludChartData(
  rows: CarteraRow[],
  selectedCodictas: ReadonlySet<string>,
) {
  const comparableRows = rows.filter((row) => row.indiceRecaudo > 0);
  const averageMetrics = {
    saludMora: averageMetricValues(comparableRows, (row) =>
      buildRadarSaludMetrics(row).saludMora,
    ),
    indice: averageMetricValues(comparableRows, (row) =>
      buildRadarSaludMetrics(row).indice,
    ),
    clientesAlDia: averageMetricValues(comparableRows, (row) =>
      buildRadarSaludMetrics(row).clientesAlDia,
    ),
    crecimiento: averageMetricValues(comparableRows, (row) =>
      buildRadarSaludMetrics(row).crecimiento,
    ),
    eficiencia: averageMetricValues(comparableRows, (row) =>
      buildRadarSaludMetrics(row).eficiencia,
    ),
  };
  const selectedRows = rows.filter((row) => selectedCodictas.has(row.codicta));

  return {
    chipRows: rows,
    selectedRows,
    labels: RADAR_SALUD_LABELS,
    datasets: [
      {
        label: "Promedio sistema",
        data: [
          averageMetrics.saludMora,
          averageMetrics.indice,
          averageMetrics.clientesAlDia,
          averageMetrics.crecimiento,
          averageMetrics.eficiencia,
        ],
        borderColor: "#aaa",
        backgroundColor: "#aaa11",
        borderDash: [5, 4],
        pointBackgroundColor: "#aaa",
        pointRadius: 3,
        borderWidth: 1.5,
      },
      ...selectedRows.map((row, index) => {
        const metrics = buildRadarSaludMetrics(row);
        const color = RADAR_SALUD_COLOR_PALETTE[index % RADAR_SALUD_COLOR_PALETTE.length];

        return {
          label: row.desccta,
          data: [
            metrics.saludMora,
            metrics.indice,
            metrics.clientesAlDia,
            metrics.crecimiento,
            metrics.eficiencia,
          ],
          borderColor: color.border,
          backgroundColor: color.background,
          pointBackgroundColor: color.border,
          pointRadius: 3,
          borderWidth: 2,
        };
      }),
    ],
  };
}
