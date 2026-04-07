import { useState } from "react";
import { Bar } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";

import { fmtCOP } from "@app/utils/formattersFunctions";

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

export default function RecaudoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [modo, setModo]       = useState<"valor" | "variacion">("valor");
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());

  const toggleCartera = (codicta: string) =>
    setOcultas((prev) => {
      const next = new Set(prev);
      next.has(codicta) ? next.delete(codicta) : next.add(codicta);
      return next;
    });

  const filas = [...data].filter(
    (r) => r.recaudoMesActual > 0 || r.recaudoMesAnterior > 0
  );

  const visibles = filas
    .filter((r) => !ocultas.has(r.codicta))
    .sort((a, b) =>
      modo === "valor"
        ? b.recaudoMesActual - a.recaudoMesActual
        : b.porcentajeVariacion - a.porcentajeVariacion
    );

  const chartData =
    modo === "valor"
      ? {
          labels: visibles.map((r) => r.desccta),
          datasets: [
            { label: "Mes actual",   data: visibles.map((r) => r.recaudoMesActual),   backgroundColor: "#4f86c6", borderRadius: 3 },
            { label: "Mes anterior", data: visibles.map((r) => r.recaudoMesAnterior), backgroundColor: "#bcd2ee", borderRadius: 3 },
          ],
        }
      : {
          labels: visibles.map((r) => r.desccta),
          datasets: [
            {
              label: "Variación %",
              data: visibles.map((r) => r.porcentajeVariacion),
              backgroundColor: visibles.map((r) =>
                r.porcentajeVariacion >= 0 ? "#6ab187" : "#d9534f"
              ),
              borderRadius: 3,
            },
          ],
        };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            modo === "valor"
              ? ` ${ctx.dataset.label}: ${fmtCOP(ctx.raw as number)}`
              : ` Variación: ${fmtPct(ctx.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (v: any) =>
            modo === "valor" ? fmtCOP(v as number) : fmtPct(v as number),
        },
      },
      y: { ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="card">
      <div className="card-body">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-0">Recaudo mes actual vs anterior</h6>

          {/* Switch $ / % */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: modo === "valor" ? "#4f86c6" : "#aaa", fontWeight: modo === "valor" ? 600 : 400 }}>
              Saldo ($)
            </span>
            <div
              onClick={() => setModo((m) => (m === "valor" ? "variacion" : "valor"))}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: modo === "variacion" ? "#4f86c6" : "#ccc",
                cursor: "pointer", position: "relative", transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3,
                left: modo === "variacion" ? 20 : 4,
                transition: "left 0.2s",
              }} />
            </div>
            <span style={{ color: modo === "variacion" ? "#4f86c6" : "#aaa", fontWeight: modo === "variacion" ? 600 : 400 }}>
              Variación (%)
            </span>
          </div>
        </div>

        <small className="text-muted d-block mb-2">
          Chips: oculta/muestra carteras
        </small>

        {/* Chips de carteras */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {filas.map((r) => {
            const hidden = ocultas.has(r.codicta);
            return (
              <button
                key={r.codicta}
                onClick={() => toggleCartera(r.codicta)}
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
                {r.desccta}
              </button>
            );
          })}
        </div>

        {/* Chart */}
        <div style={{ height: maximized ? "calc(100vh - 320px)" : visibles.length * 36 + 60 }}>
          <Bar data={chartData} options={options} />
        </div>

      </div>
    </div>
  );
}
