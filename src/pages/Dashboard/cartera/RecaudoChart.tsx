import { useState } from "react";
import { Bar } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { fmtCOP } from "@app/utils/formattersFunctions";
import { useMaximize } from "./MaximizeContext";
import {
  buildRecaudoChartData,
} from "./domain/chartBuilders";
import { useAppSelector } from "@app/store/store";

const fmtPct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

export default function RecaudoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const isMobile = useAppSelector((state) => state.ui.screenSize) === "xs";
  const [modo, setModo] = useState<"valor" | "variacion">("valor");
  const chartModel = buildRecaudoChartData(data, new Set(), modo);

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            modo === "valor"
              ? ` ${context.dataset.label}: ${fmtCOP(context.raw as number)}`
              : ` Variacion: ${fmtPct(context.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) =>
            modo === "valor" ? fmtCOP(Number(value)) : fmtPct(Number(value)),
        },
      },
      y: { ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="card">
      <div className="card-body">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h6 className="card-title text-muted mb-0">Recaudo mes actual vs anterior</h6>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span
              style={{
                color: modo === "valor" ? "#4f86c6" : "#aaa",
                fontWeight: modo === "valor" ? 600 : 400,
              }}
            >
              Saldo ($)
            </span>
            <div
              onClick={() =>
                setModo((current) =>
                  current === "valor" ? "variacion" : "valor",
                )
              }
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: modo === "variacion" ? "#4f86c6" : "#ccc",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 3,
                  left: modo === "variacion" ? 20 : 4,
                  transition: "left 0.2s",
                }}
              />
            </div>
            <span
              style={{
                color: modo === "variacion" ? "#4f86c6" : "#aaa",
                fontWeight: modo === "variacion" ? 600 : 400,
              }}
            >
              Variacion (%)
            </span>
          </div>
        </div>

        <div
          style={{
            height: maximized
              ? "calc(100vh - 320px)"
              : /* Móvil: menos alto por fila y techo, para que no crezca sin
                   límite con muchas carteras. */
                isMobile
                ? Math.min(chartModel.rowCount * 26 + 60, 800)
                : chartModel.rowCount * 36 + 60,
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
