import { useState } from "react";
import { Bar } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { fmtCOP } from "@app/utils/formattersFunctions";

const DATASETS = {
  valor: (rows: CarteraRow[]) => [
    { label: "Por vencer", data: rows.map((r) => r.pv),     backgroundColor: "#28B463" },
    { label: "30 días",    data: rows.map((r) => r.d30),    backgroundColor: "#D4AC0D" },
    { label: "60 días",    data: rows.map((r) => r.d60),    backgroundColor: "#D68910" },
    { label: "90 días",    data: rows.map((r) => r.d90),    backgroundColor: "#CA6F1E" },
    { label: "+90 días",   data: rows.map((r) => r.d90mas), backgroundColor: "#BA4A00" },
  ],
  cantidad: (rows: CarteraRow[]) => [
    { label: "Por vencer", data: rows.map((r) => r.obligacionesPV),    backgroundColor: "#28B463" },
    { label: "30 días",    data: rows.map((r) => r.obligaciones30),    backgroundColor: "#D4AC0D" },
    { label: "60 días",    data: rows.map((r) => r.obligaciones60),    backgroundColor: "#D68910" },
    { label: "90 días",    data: rows.map((r) => r.obligaciones90),    backgroundColor: "#CA6F1E" },
    { label: "+90 días",   data: rows.map((r) => r.obligaciones90mas), backgroundColor: "#BA4A00" },
  ],
};

export default function AgingChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [modo, setModo]     = useState<"valor" | "cantidad">("valor");
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());

  const toggleCartera = (codicta: string) =>
    setOcultas((prev) => {
      const next = new Set(prev);
      next.has(codicta) ? next.delete(codicta) : next.add(codicta);
      return next;
    });

  const filas = [...data].filter((r) =>
    modo === "cantidad" ? r.obligacionesTotal > 0 : r.total > 0
  );

  const visibles = filas
    .filter((r) => !ocultas.has(r.codicta))
    .sort((a, b) =>
      modo === "valor" ? b.total - a.total : b.obligacionesTotal - a.obligacionesTotal
    );

  const chartData = {
    labels: visibles.map((r) => r.desccta),
    datasets: DATASETS[modo](visibles),
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
              : ` ${ctx.dataset.label}: ${(ctx.raw as number).toLocaleString("es-CO")} obligaciones`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: modo === "valor" ? { callback: (v: any) => fmtCOP(v as number) } : {},
      },
      y: { stacked: true, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="card">
      <div className="card-body">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-0">Aging de cartera</h6>

          {/* Switch Obligaciones / Saldo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: modo === "cantidad" ? "#4f86c6" : "#aaa", fontWeight: modo === "cantidad" ? 600 : 400 }}>
              Obligaciones
            </span>
            <div
              onClick={() => setModo((m) => (m === "valor" ? "cantidad" : "valor"))}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: modo === "valor" ? "#4f86c6" : "#ccc",
                cursor: "pointer", position: "relative", transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3,
                left: modo === "valor" ? 20 : 4,
                transition: "left 0.2s",
              }} />
            </div>
            <span style={{ color: modo === "valor" ? "#4f86c6" : "#aaa", fontWeight: modo === "valor" ? 600 : 400 }}>
              Saldo ($)
            </span>
          </div>
        </div>

        <small className="text-muted d-block mb-2">
          Leyenda: oculta/muestra edades · Chips: oculta/muestra carteras
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
        <div style={{ height: maximized ? "calc(100vh - 320px)" : visibles.length * 28 + 60 }}>
          <Bar data={chartData} options={options} />
        </div>

      </div>
    </div>
  );
}
