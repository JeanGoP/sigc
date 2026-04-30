import { Doughnut } from "react-chartjs-2";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { buildConcentracionCarteraChartData } from "./domain/remainingChartBuilders";

export default function ConcentracionCarteraChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const chartModel = buildConcentracionCarteraChartData(data);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const, labels: { font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            ` ${context.label}: ${fmtCOP(context.raw as number)}`,
        },
      },
    },
  };

  return (
    <div className="card h-100">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">Concentracion de cartera (top 10)</h6>
        <div style={{ height: maximized ? "calc(100vh - 160px)" : 280 }}>
          <Doughnut
            data={{
              labels: chartModel.labels,
              datasets: chartModel.datasets,
            }}
            options={options}
          />
        </div>
      </div>
    </div>
  );
}
