import { Scatter } from "react-chartjs-2";
import { Chart as ChartJS, ScatterController } from "chart.js";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { buildEficienciaRecuperacionChartData } from "./domain/remainingChartBuilders";

ChartJS.register(ScatterController);

export default function EficienciaRecuperacionChart({
  data,
}: {
  data: CarteraRow[];
}) {
  const maximized = useMaximize();
  const chartModel = buildEficienciaRecuperacionChartData(data);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `${context.raw.label} - Vencida: ${fmtCOP((context.raw.x as number) * 1_000_000)} | Recaudo: ${fmtCOP((context.raw.y as number) * 1_000_000)}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Cartera vencida ($M)" },
        ticks: { callback: (value: any) => `$${value}M` },
      },
      y: {
        title: { display: true, text: "Recaudo mes actual ($M)" },
        ticks: { callback: (value: any) => `$${value}M` },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">
          Eficiencia de recuperacion - Vencida vs Recaudo
        </h6>
        <div style={{ height: maximized ? "calc(100vh - 160px)" : 320 }}>
          <Scatter data={{ datasets: chartModel.datasets }} options={options} />
        </div>
      </div>
    </div>
  );
}
