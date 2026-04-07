import { Radar } from "react-chartjs-2";
import { RadarController, RadialLinearScale, Filler } from "chart.js";
import { Chart as ChartJS } from "chart.js";
import { useState } from "react";
import { useMaximize } from "./MaximizeContext";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";

ChartJS.register(RadarController, RadialLinearScale, Filler);

const COLORS = [
  { border: "#4f86c6", bg: "#4f86c622" },
  { border: "#6ab187", bg: "#6ab18722" },
  { border: "#d9534f", bg: "#d9534f22" },
  { border: "#f0ad4e", bg: "#f0ad4e22" },
  { border: "#8e44ad", bg: "#8e44ad22" },
  { border: "#e67e22", bg: "#e67e2222" },
  { border: "#1abc9c", bg: "#1abc9c22" },
  { border: "#2c3e50", bg: "#2c3e5022" },
];

const norm = (v: number, min: number, max: number) =>
  max === min ? 0 : Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));

const metricas = (r: CarteraRow) => ({
  saludMora:     Math.max(0, 100 - r.carteraVencidaPorc),
  indice:        norm(r.indiceRecaudo, 0, 20),
  clientesAlDia: r.obligacionesTotal > 0
    ? (r.obligacionesPV / r.obligacionesTotal) * 100
    : 0,
  crecimiento:   norm(r.porcentajeVariacion, -20, 20),
  eficiencia:    r.carteraVencida > 0
    ? Math.min(100, (r.recaudoVencido / r.carteraVencida) * 100)
    : 100,
});

export default function RadarSaludChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [visibles, setVisibles] = useState<Set<string>>(new Set());

  const toggleCartera = (codicta: string) =>
    setVisibles((prev) => {
      const next = new Set(prev);
      next.has(codicta) ? next.delete(codicta) : next.add(codicta);
      return next;
    });

  // Promedio general (todas las carteras con recaudo válido)
  const conDatos = data.filter((r) => r.indiceRecaudo > 0);
  const avg = {
    saludMora:     conDatos.reduce((s, r) => s + metricas(r).saludMora, 0)     / conDatos.length,
    indice:        conDatos.reduce((s, r) => s + metricas(r).indice, 0)         / conDatos.length,
    clientesAlDia: conDatos.reduce((s, r) => s + metricas(r).clientesAlDia, 0)  / conDatos.length,
    crecimiento:   conDatos.reduce((s, r) => s + metricas(r).crecimiento, 0)    / conDatos.length,
    eficiencia:    conDatos.reduce((s, r) => s + metricas(r).eficiencia, 0)     / conDatos.length,
  };

  const seleccionadas = data.filter((r) => visibles.has(r.codicta));

  const datasets = [
    // Línea de promedio siempre visible
    {
      label: "Promedio sistema",
      data: [avg.saludMora, avg.indice, avg.clientesAlDia, avg.crecimiento, avg.eficiencia],
      borderColor: "#aaa",
      backgroundColor: "#aaa11",
      borderDash: [5, 4],
      pointBackgroundColor: "#aaa",
      pointRadius: 3,
      borderWidth: 1.5,
    },
    // Carteras seleccionadas
    ...seleccionadas.map((r, i) => {
      const m = metricas(r);
      const c = COLORS[i % COLORS.length];
      return {
        label: r.desccta,
        data: [m.saludMora, m.indice, m.clientesAlDia, m.crecimiento, m.eficiencia],
        borderColor: c.border,
        backgroundColor: c.bg,
        pointBackgroundColor: c.border,
        pointRadius: 3,
        borderWidth: 2,
      };
    }),
  ];

  const chartData = {
    labels: ["Salud mora", "Índice recaudo", "Clientes al día", "Crecimiento recaudo", "Eficiencia recuperación"],
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const, labels: { font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${(ctx.raw as number).toFixed(1)}`,
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
            Ejes normalizados 0–100 · Mayor área = mejor desempeño · La línea gris es el promedio del sistema
          </small>
        </div>

        <small className="text-muted d-block mt-2 mb-2">
          Selecciona las carteras que deseas comparar
        </small>

        {/* Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {data.map((r, i) => {
            const active = visibles.has(r.codicta);
            const color  = COLORS[
              [...visibles].indexOf(r.codicta) % COLORS.length
            ]?.border ?? "#ccc";
            return (
              <button
                key={r.codicta}
                onClick={() => toggleCartera(r.codicta)}
                style={{
                  padding: "2px 9px",
                  fontSize: 11,
                  borderRadius: 12,
                  border: `1px solid ${active ? color : "#ccc"}`,
                  background: active ? color + "22" : "#f5f5f5",
                  color: active ? color : "#bbb",
                  cursor: "pointer",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                {r.desccta}
              </button>
            );
          })}
        </div>

        {visibles.size === 0 ? (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="text-muted" style={{ fontSize: 13 }}>
              Selecciona al menos una cartera para visualizar su perfil
            </span>
          </div>
        ) : (
          <div style={{ height: maximized ? "calc(100vh - 320px)" : 360 }}>
            <Radar data={chartData} options={options} />
          </div>
        )}

      </div>
    </div>
  );
}
