import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, LineController, LineElement } from "chart.js";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { toggleHiddenDashboardCartera } from "./domain/chartBuilders";
import { buildMixedRecaudoIndiceChartData } from "./domain/remainingChartBuilders";

ChartJS.register(LineController, LineElement);

export default function MixedRecaudoIndiceChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const chartModel = buildMixedRecaudoIndiceChartData(data, ocultas);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const },
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            context.datasetIndex === 0
              ? ` Recaudo: ${fmtCOP(context.raw as number)}`
              : ` Indice: ${(context.raw as number).toFixed(2)}%`,
        },
      },
    },
    scales: {
      x: { ticks: { font: { size: 10 } } },
      yRecaudo: {
        type: "linear" as const,
        position: "left" as const,
        ticks: { callback: (value: any) => fmtCOP(value as number) },
        title: { display: true, text: "Recaudo ($)" },
      },
      yIndice: {
        type: "linear" as const,
        position: "right" as const,
        grid: { drawOnChartArea: false },
        ticks: { callback: (value: any) => `${value}%` },
        title: { display: true, text: "Indice recaudo (%)" },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-0">
            Recaudo vs Indice de recaudo por cartera
          </h6>
        </div>

        <small className="text-muted d-block mb-2">Chips: oculta/muestra carteras</small>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {chartModel.chipRows.map((row) => {
            const hidden = ocultas.has(row.codicta);

            return (
              <button
                key={row.codicta}
                onClick={() =>
                  setOcultas((current) =>
                    toggleHiddenDashboardCartera(current, row.codicta),
                  )
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

        <div style={{ height: maximized ? "calc(100vh - 320px)" : 340 }}>
          <Bar
            data={{
              labels: chartModel.labels,
              datasets: chartModel.datasets,
            } as any}
            options={options as any}
          />
        </div>
      </div>
    </div>
  );
}
