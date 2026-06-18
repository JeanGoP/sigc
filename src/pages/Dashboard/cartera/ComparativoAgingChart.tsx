import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { type Plugin } from "chart.js";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import {
  buildComparativoAgingChartData,
  calculateDashboardPercentDelta,
} from "./domain/advancedChartBuilders";

const gapPlugin: Plugin<"bar"> = {
  id: "gapPlugin",
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;
    const count = data.labels?.length ?? 0;

    if (!count) {
      return;
    }

    for (let index = 0; index < count; index += 1) {
      let sumActual = 0;
      let sumPrevious = 0;
      let xMax = 0;

      for (let datasetIndex = 0; datasetIndex < data.datasets.length; datasetIndex += 1) {
        const meta = chart.getDatasetMeta(datasetIndex);

        if (meta.hidden) {
          continue;
        }

        const dataset = data.datasets[datasetIndex] as any;
        const value = (dataset.data[index] as number) ?? 0;
        const barElement = meta.data[index] as any;

        if (barElement?.x > xMax) {
          xMax = barElement.x;
        }

        if (dataset.stack === "actual") {
          sumActual += value;
        }

        if (dataset.stack === "anterior") {
          sumPrevious += value;
        }
      }

      if (!sumPrevious) {
        continue;
      }

      const delta = sumActual - sumPrevious;
      const pct = calculateDashboardPercentDelta(sumActual, sumPrevious);
      const positive = delta >= 0;
      const label = `${fmtCOP(delta, true)} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`;

      const currentBar = chart.getDatasetMeta(0).data[index] as any;
      const previousBar = chart.getDatasetMeta(5).data[index] as any;

      if (!currentBar || !previousBar) {
        continue;
      }

      const yCenter = (currentBar.y + previousBar.y) / 2;

      ctx.save();
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = positive ? "#28B463" : "#BA4A00";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, xMax + 8, yCenter);
      ctx.restore();
    }
  },
};

export default function ComparativoAgingChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const chartModel = buildComparativoAgingChartData(data, new Set(), "total");

  const obligacionesPorTramo = useMemo(() => {
    return chartModel.visibleRows.reduce(
      (sum, row) => ({
        pv: sum.pv + row.obligacionesPV,
        d30: sum.d30 + row.obligaciones30,
        d60: sum.d60 + row.obligaciones60,
        d90: sum.d90 + row.obligaciones90,
        d90mas: sum.d90mas + row.obligaciones90mas,
      }),
      { pv: 0, d30: 0, d60: 0, d90: 0, d90mas: 0 },
    );
  }, [chartModel.visibleRows]);

  const distributionOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 165 } },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          font: { size: 10 },
          boxWidth: 10,
          generateLabels: (chart: any) => {
            const trancheMeta = [
              { datasetIndex: 0, key: "pv" as const },
              { datasetIndex: 1, key: "d30" as const },
              { datasetIndex: 2, key: "d60" as const },
              { datasetIndex: 3, key: "d90" as const },
              { datasetIndex: 4, key: "d90mas" as const },
            ];

            return trancheMeta.map(({ datasetIndex, key }) => {
              const dataset = chart.data.datasets[datasetIndex];
              const meta = chart.getDatasetMeta(datasetIndex);
              const count = obligacionesPorTramo[key] ?? 0;

              return {
                text: `${dataset.label} (${count.toLocaleString("es-CO")} oblig.)`,
                fillStyle: dataset.backgroundColor,
                strokeStyle: dataset.backgroundColor,
                lineWidth: 0,
                hidden: meta.hidden,
                datasetIndex,
              };
            });
          },
        },
        onClick: (_event: any, item: any, legend: any) => {
          const chart = legend.chart;
          const datasetIndex = item.datasetIndex as number;
          const currentMeta = chart.getDatasetMeta(datasetIndex);
          currentMeta.hidden = !currentMeta.hidden;
          const previousIndex = datasetIndex + 5;

          if (previousIndex < chart.data.datasets.length) {
            chart.getDatasetMeta(previousIndex).hidden = currentMeta.hidden;
          }

          chart.update();
        },
      },
      tooltip: {
        callbacks: {
          title: (items: any[]) => items[0]?.label ?? "",
          label: (context: any) => {
            const value = context.raw as number;

            if (!value) {
              return null;
            }

            const isPrevious = (context.dataset.stack as string) === "anterior";
            const tramo = context.dataset.label.replace(" ant", "");
            const row = chartModel.visibleRows[context.dataIndex] as CarteraRow | undefined;
            const obligaciones =
              row && !isPrevious
                ? tramo === "PV"
                  ? row.obligacionesPV
                  : tramo === "30d"
                    ? row.obligaciones30
                    : tramo === "60d"
                      ? row.obligaciones60
                      : tramo === "90d"
                        ? row.obligaciones90
                        : tramo === "+90d"
                          ? row.obligaciones90mas
                          : 0
                : null;

            const base = ` ${tramo}${isPrevious ? " (anterior)" : ""}: ${fmtCOP(value)}`;
            return typeof obligaciones === "number"
              ? [base, ` Oblig.: ${obligaciones.toLocaleString("es-CO")}`]
              : base;
          },
        },
      },
    } as any,
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: (value: any) => fmtCOP(value as number),
          font: { size: 10 },
          maxTicksLimit: 5,
        },
      },
      y: {
        stacked: true,
        ticks: { font: { size: 11 } },
      },
    },
  };

  const rowHeight = chartModel.hayAnt ? 52 : 28;
  const chartHeight = maximized
    ? "calc(100vh - 320px)"
    : `${chartModel.rowCount * rowHeight + 60}px`;

  return (
    <div className="card">
      <div className="card-body">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h6 className="card-title text-muted mb-0">
            Comparativo saldo por tramo · Actual vs Anterior
          </h6>
        </div>

        {chartModel.hayAnt && (
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#666", marginBottom: 6 }}>
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  background: "#4f86c6",
                  borderRadius: 2,
                  marginRight: 4,
                }}
              />
              Barra <strong>superior</strong> = Actual
            </span>
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  background: "#b0bec5",
                  borderRadius: 2,
                  marginRight: 4,
                }}
              />
              Barra <strong>inferior</strong> = Anterior
            </span>
          </div>
        )}

        {!chartModel.hayAnt && (
          <div
            style={{
              fontSize: 11,
              color: "#bbb",
              marginBottom: 8,
              fontStyle: "italic",
            }}
          >
            Sin datos del periodo anterior. Mostrando solo saldo actual.
          </div>
        )}

        <div style={{ height: chartHeight }}>
          <Bar
            data={{
              labels: chartModel.labels,
              datasets: chartModel.distribucionDatasets,
            }}
            options={distributionOptions}
            plugins={chartModel.hayAnt ? [gapPlugin] : []}
          />
        </div>
      </div>
    </div>
  );
}
