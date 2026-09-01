import { useMemo } from "react";
import { Radar } from "react-chartjs-2";
import { Chart as ChartJS, Filler, RadarController, RadialLinearScale } from "chart.js";
import { useMaximize } from "./MaximizeContext";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import {
  buildRadarSaludChartData,
} from "./domain/advancedChartBuilders";
import { useAppSelector } from "@app/store/store";

ChartJS.register(RadarController, RadialLinearScale, Filler);

export default function RadarSaludChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const isMobile = useAppSelector((state) => state.ui.screenSize) === "xs";
  const selectedCodictas = useMemo(
    () => new Set(data.map((row) => row.codicta)),
    [data],
  );
  const chartModel = buildRadarSaludChartData(data, selectedCodictas);

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
            ` ${context.dataset.label}: ${(context.raw as number).toFixed(1)}`,
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 25, font: { size: 10 } },
        pointLabels: { font: { size: 11 } },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-1">Perfil de salud por cartera</h6>
          <small className="text-muted">
            Ejes normalizados 0-100. Mayor area = mejor desempeno. La linea gris es el promedio del sistema.
          </small>
        </div>

        {chartModel.selectedRows.length === 0 ? (
          <div
            style={{
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="text-muted" style={{ fontSize: 13 }}>
              No hay carteras seleccionadas para comparar
            </span>
          </div>
        ) : (
          <div
            style={{
              /* En móvil NO se baja la altura: la leyenda pasó de derecha a
                 abajo, así que necesita alto extra para no comerle área al radar. */
              height: maximized ? "calc(100vh - 320px)" : isMobile ? 400 : 360,
            }}
          >
            <Radar
              data={{
                labels: chartModel.labels,
                datasets: chartModel.datasets,
              }}
              options={options}
            />
          </div>
        )}
      </div>
    </div>
  );
}
