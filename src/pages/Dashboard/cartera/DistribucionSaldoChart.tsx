import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { fmtCOP } from "@app/utils/formattersFunctions";
import { useMaximize } from "./MaximizeContext";
import {
  buildDistribucionSaldoChartData,
} from "./domain/chartBuilders";

export default function DistribucionSaldoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const chartModel = buildDistribucionSaldoChartData(data, new Set());
  const containerHeight = useMemo(
    () => (maximized ? "calc(100vh - 220px)" : 240),
    [maximized],
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.label}: ${fmtCOP(context.raw as number)}`,
        },
      },
    },
  };

  return (
    <div className="card h-100">
      <div className="card-body" style={{ display: "flex", flexDirection: "column" }}>
        <h6 className="card-title text-muted mb-2">Distribucion saldo por edad</h6>
        <div style={{ height: containerHeight }}>
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
