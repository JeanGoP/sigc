import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { fmtCOP } from "@app/utils/formattersFunctions";
import { useMaximize } from "./MaximizeContext";
import {
  buildDistribucionSaldoChartData,
} from "./domain/chartBuilders";
import { useAppSelector } from "@app/store/store";

export default function DistribucionSaldoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const isMobile = useAppSelector((state) => state.ui.screenSize) === "xs";
  const chartModel = buildDistribucionSaldoChartData(data, new Set());
  /* En móvil se sube el alto porque la leyenda pasa de derecha a abajo. */
  const containerHeight = useMemo(
    () => (maximized ? "calc(100vh - 220px)" : isMobile ? 300 : 240),
    [maximized, isMobile],
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        /* A la derecha, la leyenda se comía ~40% del ancho en 375px. */
        position: (isMobile ? "bottom" : "right") as "bottom" | "right",
        labels: { boxWidth: isMobile ? 10 : undefined },
      },
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
