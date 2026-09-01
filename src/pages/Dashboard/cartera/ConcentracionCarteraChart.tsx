import { Doughnut } from "react-chartjs-2";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { buildConcentracionCarteraChartData } from "./domain/remainingChartBuilders";
import { useAppSelector } from "@app/store/store";

export default function ConcentracionCarteraChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const isMobile = useAppSelector((state) => state.ui.screenSize) === "xs";
  const chartModel = buildConcentracionCarteraChartData(data);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        /* A la derecha, la leyenda se comía ~40% del ancho en 375px. */
        position: (isMobile ? "bottom" : "right") as "bottom" | "right",
        labels: { font: { size: 11 }, boxWidth: isMobile ? 10 : undefined },
      },
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
        {/* En móvil se sube el alto: la leyenda pasó a abajo y son 10 items,
            así que necesita espacio propio para no aplastar la dona. */}
        <div
          style={{
            height: maximized ? "calc(100vh - 160px)" : isMobile ? 360 : 280,
          }}
        >
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
