import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { type Plugin } from "chart.js";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import {
  buildComparativoAgingChartData,
  calculateDashboardPercentDelta,
  type ComparativoAgingSegment,
  type ComparativoAgingViewMode,
  COMPARATIVO_AGING_SEGMENTS,
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
  const [view, setView] = useState<ComparativoAgingViewMode>("distribucion");
  const [segmento, setSegmento] = useState<ComparativoAgingSegment>("total");
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const chartModel = buildComparativoAgingChartData(data, ocultas, segmento);

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
          filter: (item: any) => !item.text.includes("ant"),
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

            return ` ${tramo}${isPrevious ? " (anterior)" : ""}: ${fmtCOP(value)}`;
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

  const variationOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const delta = context.raw as number;
            const row = chartModel.visibleRows[context.dataIndex];
            const previous = chartModel.activeSegment.previous(row);
            const pct = calculateDashboardPercentDelta(
              chartModel.activeSegment.active(row),
              previous,
            );

            return ` ${fmtCOP(delta, true)} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value: any) => fmtCOP(value as number),
          font: { size: 10 },
          maxTicksLimit: 6,
        },
        grid: {
          color: (context: any) =>
            context.tick?.value === 0 ? "#999" : "#e8eaed",
          lineWidth: (context: any) => (context.tick?.value === 0 ? 2 : 1),
        },
      },
      y: { ticks: { font: { size: 11 } } },
    },
  };

  const rowHeight = view === "distribucion" && chartModel.hayAnt ? 52 : 28;
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
          <div style={{ display: "flex", gap: 6 }}>
            {(["distribucion", "variacion"] as ComparativoAgingViewMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  style={{
                    padding: "2px 12px",
                    fontSize: 11,
                    borderRadius: 12,
                    border: "1px solid",
                    borderColor: view === mode ? "#4f86c6" : "#ddd",
                    background: view === mode ? "#4f86c6" : "#fff",
                    color: view === mode ? "#fff" : "#666",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {mode === "distribucion" ? "Distribucion" : "Variacion Delta"}
                </button>
              ),
            )}
          </div>
        </div>

        {view === "variacion" && (
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 11, color: "#aaa" }}>Tramo:</span>
            {COMPARATIVO_AGING_SEGMENTS.map((item) => (
              <button
                key={item.key}
                onClick={() => setSegmento(item.key)}
                style={{
                  padding: "2px 10px",
                  fontSize: 11,
                  borderRadius: 12,
                  border: "1px solid",
                  borderColor: segmento === item.key ? "#CA6F1E" : "#ddd",
                  background: segmento === item.key ? "#CA6F1E" : "#fff",
                  color: segmento === item.key ? "#fff" : "#666",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {view === "distribucion" && chartModel.hayAnt && (
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

        <small className="text-muted d-block mb-2">Chips: oculta/muestra carteras</small>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {chartModel.chipRows.map((row) => {
            const hidden = ocultas.has(row.codicta);

            return (
              <button
                key={row.codicta}
                onClick={() =>
                  setOcultas((current) => {
                    const next = new Set(current);
                    if (next.has(row.codicta)) {
                      next.delete(row.codicta);
                    } else {
                      next.add(row.codicta);
                    }
                    return next;
                  })
                }
                style={{
                  padding: "2px 9px",
                  fontSize: 11,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  background: hidden ? "#f5f5f5" : "#fff",
                  color: hidden ? "#bbb" : "#444",
                  cursor: "pointer",
                  textDecoration: hidden ? "line-through" : "none",
                  transition: "all 0.15s",
                }}
              >
                {row.desccta}
              </button>
            );
          })}
        </div>

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
          {view === "distribucion" ? (
            <Bar
              data={{
                labels: chartModel.labels,
                datasets: chartModel.distribucionDatasets,
              }}
              options={distributionOptions}
              plugins={chartModel.hayAnt ? [gapPlugin] : []}
            />
          ) : (
            <Bar
              data={{
                labels: chartModel.labels,
                datasets: [chartModel.variacionDataset],
              }}
              options={variationOptions}
            />
          )}
        </div>
      </div>
    </div>
  );
}
