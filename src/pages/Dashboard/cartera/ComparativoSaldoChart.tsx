import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { type Plugin } from "chart.js";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import {
  buildComparativoSaldoChartData,
  calculateDashboardPercentDelta,
  type ComparativoSaldoSortKey,
} from "./domain/advancedChartBuilders";
import { useAppSelector } from "@app/store/store";

const deltaLabelPlugin: Plugin<"bar"> = {
  id: "deltaLabel",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const currentMeta = chart.getDatasetMeta(0);
    const previousMeta = chart.getDatasetMeta(1);

    if (!currentMeta.data.length || !previousMeta.data.length) {
      return;
    }

    currentMeta.data.forEach((currentBar, index) => {
      const previousBar = previousMeta.data[index];
      const current = (chart.data.datasets[0].data[index] as number) ?? 0;
      const previous = (chart.data.datasets[1].data[index] as number) ?? 0;

      if (!previous) {
        return;
      }

      const pct = calculateDashboardPercentDelta(current, previous);
      const xRight = Math.max((currentBar as any).x, (previousBar as any).x) + 6;
      const yCenter = ((currentBar as any).y + (previousBar as any).y) / 2;
      const positive = pct >= 0;

      ctx.save();
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = positive ? "#6ab187" : "#d9534f";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`${positive ? "+" : ""}${pct.toFixed(1)}%`, xRight, yCenter);
      ctx.restore();
    });
  },
};

export default function ComparativoSaldoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const isMobile = useAppSelector((state) => state.ui.screenSize) === "xs";
  const [sortBy, setSortBy] = useState<ComparativoSaldoSortKey>("actual");
  const chartModel = buildComparativoSaldoChartData(data, new Set(), sortBy);

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 64 } },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: { font: { size: 11 }, boxWidth: 12 },
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            ` ${context.dataset.label}: ${fmtCOP(context.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => fmtCOP(value as number),
          font: { size: 10 },
          maxTicksLimit: 6,
        },
      },
      y: { ticks: { font: { size: 11 } } },
    },
  };

  /* Móvil: menos alto por fila y techo, para que no crezca sin límite con
     muchas carteras. El padding derecho de 64px NO se toca: está ajustado al
     ancho real del texto de delta que dibuja deltaLabelPlugin. */
  const rowHeight = isMobile
    ? chartModel.hayAnt
      ? 34
      : 20
    : chartModel.hayAnt
      ? 46
      : 26;
  const naturalHeight = chartModel.rowCount * rowHeight + 60;
  const chartHeight = maximized
    ? "calc(100vh - 300px)"
    : `${isMobile ? Math.min(naturalHeight, 800) : naturalHeight}px`;

  return (
    <div className="card">
      <div className="card-body">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <h6 className="card-title text-muted mb-0">
            Saldo total por cartera
            {chartModel.hayAnt && (
              <span
                style={{
                  fontSize: 11,
                  color: "#aaa",
                  fontWeight: 400,
                  marginLeft: 8,
                }}
              >
                Actual vs Anterior
              </span>
            )}
          </h6>

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, fontSize: 12 }}>
            <span style={{ color: "#aaa" }}>Ordenar:</span>
            {(["actual", "anterior", "delta"] as ComparativoSaldoSortKey[]).map(
              (key) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  disabled={key === "anterior" && !chartModel.hayAnt}
                  style={{
                    padding: "2px 10px",
                    fontSize: 11,
                    borderRadius: 12,
                    border: "1px solid",
                    borderColor: sortBy === key ? "#4f86c6" : "#ddd",
                    background: sortBy === key ? "#4f86c6" : "#fff",
                    color: sortBy === key ? "#fff" : "#666",
                    cursor:
                      key === "anterior" && !chartModel.hayAnt
                        ? "not-allowed"
                        : "pointer",
                    opacity: key === "anterior" && !chartModel.hayAnt ? 0.4 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {key === "actual" ? "Actual" : key === "anterior" ? "Anterior" : "Delta %"}
                </button>
              ),
            )}
          </div>
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
            Sin datos del periodo anterior. Se muestra solo el saldo actual.
          </div>
        )}

        <div style={{ height: chartHeight }}>
          <Bar
            data={{
              labels: chartModel.labels,
              datasets: chartModel.datasets,
            }}
            options={options}
            plugins={chartModel.hayAnt ? [deltaLabelPlugin] : []}
          />
        </div>
      </div>
    </div>
  );
}
