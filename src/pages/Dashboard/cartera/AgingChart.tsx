import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { toggleHiddenDashboardCartera } from "./domain/chartBuilders";
import { buildAgingChartData } from "./domain/remainingChartBuilders";

export default function AgingChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [modo, setModo] = useState<"valor" | "cantidad">("valor");
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const chartModel = buildAgingChartData(data, ocultas, modo);

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
              : ` ${context.dataset.label}: ${(context.raw as number).toLocaleString("es-CO")} obligaciones`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: modo === "valor" ? { callback: (value: any) => fmtCOP(value as number) } : {},
      },
      y: {
        stacked: true,
        ticks: { font: { size: 11 } },
      },
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
          <h6 className="card-title text-muted mb-0">Aging de cartera</h6>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span
              style={{
                color: modo === "cantidad" ? "#4f86c6" : "#aaa",
                fontWeight: modo === "cantidad" ? 600 : 400,
              }}
            >
              Obligaciones
            </span>
            <div
              onClick={() =>
                setModo((current) => (current === "valor" ? "cantidad" : "valor"))
              }
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: modo === "valor" ? "#4f86c6" : "#ccc",
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
                  left: modo === "valor" ? 20 : 4,
                  transition: "left 0.2s",
                }}
              />
            </div>
            <span
              style={{
                color: modo === "valor" ? "#4f86c6" : "#aaa",
                fontWeight: modo === "valor" ? 600 : 400,
              }}
            >
              Saldo ($)
            </span>
          </div>
        </div>

        <small className="text-muted d-block mb-2">
          Leyenda: oculta/muestra edades. Chips: oculta/muestra carteras
        </small>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {chartModel.chipRows.map((row) => {
            const hidden = ocultas.has(row.codicta);

            return (
              <button
                key={row.codicta}
                onClick={() =>
                  setOcultas((current) =>
                    toggleHiddenDashboardCartera(current, row.codicta),
                  )
                }
                style={{
                  padding: "2px 9px",
                  fontSize: 11,
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  background: hidden ? "#f5f5f5" : "#fff",
                  color: hidden ? "#bbb" : "#444",
                  cursor: "pointer",
                  textDecoration: hidden ? "line-through" : "none",
                  transition: "all 0.15s",
                }}
              >
                {row.desccta}
              </button>
            );
          })}
        </div>

        <div
          style={{
            height: maximized
              ? "calc(100vh - 320px)"
              : chartModel.rowCount * 28 + 60,
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
