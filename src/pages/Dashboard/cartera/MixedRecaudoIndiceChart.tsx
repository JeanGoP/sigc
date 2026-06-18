import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, LineController, LineElement } from "chart.js";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { buildMixedRecaudoIndiceChartData } from "./domain/remainingChartBuilders";

ChartJS.register(LineController, LineElement);

export default function MixedRecaudoIndiceChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const chartModel = useMemo(
    () => buildMixedRecaudoIndiceChartData(data, new Set()),
    [data],
  );

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
