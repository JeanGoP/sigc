import { useMemo } from "react";
import { Bubble } from "react-chartjs-2";
import { BubbleController, Chart as ChartJS } from "chart.js";
import { useMaximize } from "./MaximizeContext";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import {
  buildBubbleRiesgoChartData,
} from "./domain/advancedChartBuilders";

ChartJS.register(BubbleController);

export default function BubbleRiesgoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const chartModel = useMemo(
    () => buildBubbleRiesgoChartData(data, new Set()),
    [data],
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `${context.dataset.label} - Vencida: ${(context.raw.x as number).toFixed(1)}% | Indice recaudo: ${(context.raw.y as number).toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "% Cartera vencida -> mayor riesgo" },
        ticks: { callback: (value: any) => `${value}%` },
      },
      y: {
        title: { display: true, text: "Indice de recaudo % -> mejor desempeno" },
        ticks: { callback: (value: any) => `${value}%` },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-1">Mapa de riesgo-recaudo</h6>
          <small className="text-muted">Tamano = saldo total</small>
        </div>

        <div style={{ height: maximized ? "calc(100vh - 320px)" : 380 }}>
          <Bubble data={{ datasets: chartModel.datasets }} options={options} />
        </div>
      </div>
    </div>
  );
}
