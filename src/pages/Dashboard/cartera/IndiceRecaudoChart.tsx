import { Bar } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { buildIndiceRecaudoChartData } from "./domain/chartBuilders";
import { useAppSelector } from "@app/store/store";

export default function IndiceRecaudoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const isMobile = useAppSelector((state) => state.ui.screenSize) === "xs";
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
              : /* Móvil: menos alto por fila y techo, para que no crezca sin
                   límite con muchas carteras. */
                isMobile
                ? Math.min(chartModel.labels.length * 20 + 40, 800)
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
