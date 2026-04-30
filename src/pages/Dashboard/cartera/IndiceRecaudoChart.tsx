import { Bar } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { buildIndiceRecaudoChartData } from "./domain/chartBuilders";

export default function IndiceRecaudoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const chartModel = buildIndiceRecaudoChartData(data);

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${(context.raw as number).toFixed(2)}%`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { callback: (value: string | number) => `${value}%` },
      },
      y: { ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="card">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">Indice de recaudo por cartera (%)</h6>
        <div
          style={{
            height: maximized
              ? "calc(100vh - 160px)"
              : chartModel.labels.length * 28 + 40,
          }}
        >
          <Bar
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
