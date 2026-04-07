import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { type Plugin } from "chart.js";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";

// Plugin inline para dibujar la línea de umbral
const umbralPlugin: Plugin<"bar"> = {
  id: "umbralLine",
  afterDraw(chart, _, opts) {
    const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
    const xPos = x.getPixelForValue(opts.value);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xPos, top);
    ctx.lineTo(xPos, bottom);
    ctx.strokeStyle = opts.color ?? "#BA4A00";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();
  },
};

export default function CarteraVencidaChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [ocultas, setOcultas]   = useState<Set<string>>(new Set());
  const [umbral, setUmbral]     = useState(15);
  const [inputVal, setInputVal] = useState("15");

  const toggleCartera = (codicta: string) =>
    setOcultas((prev) => {
      const next = new Set(prev);
      next.has(codicta) ? next.delete(codicta) : next.add(codicta);
      return next;
    });

  const handleUmbralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    const n = parseFloat(e.target.value);
    if (!isNaN(n) && n >= 0 && n <= 100) setUmbral(n);
  };

  const sorted = [...data]
    .filter((r) => !ocultas.has(r.codicta))
    .sort((a, b) => b.carteraVencidaPorc - a.carteraVencidaPorc);

  const chartData = {
    labels: sorted.map((r) => r.desccta),
    datasets: [{
      label: "% Cartera vencida",
      data: sorted.map((r) => r.carteraVencidaPorc),
      backgroundColor: sorted.map((r) =>
        r.carteraVencidaPorc >= 50     ? "#BA4A00" :
        r.carteraVencidaPorc >= umbral ? "#CA6F1E" :
        r.carteraVencidaPorc >= 8      ? "#D68910" : "#28B463"
      ),
      borderRadius: 3,
    }],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${(ctx.raw as number).toFixed(2)}%`,
        },
      },
      umbralLine: { value: umbral, color: "#BA4A00" },
    } as any,
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (v: any) => `${v}%` },
      },
      y: { ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="card">
      <div className="card-body">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h6 className="card-title text-muted mb-0">% Cartera vencida por cartera</h6>

          {/* Input umbral */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: "#aaa" }}>Umbral crítico:</span>
            <input
              type="number"
              min={0}
              max={100}
              value={inputVal}
              onChange={handleUmbralChange}
              style={{
                width: 60,
                padding: "2px 6px",
                fontSize: 13,
                border: "1px solid #ccc",
                borderRadius: 6,
                textAlign: "center",
              }}
            />
            <span style={{ color: "#aaa" }}>%</span>
          </div>
        </div>

        <small className="text-muted d-block mb-2">Chips: oculta/muestra carteras</small>

        {/* Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {data.map((r) => {
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

        <div style={{ height: maximized ? "calc(100vh - 320px)" : sorted.length * 28 + 40 }}>
          <Bar data={chartData} options={options} plugins={[umbralPlugin]} />
        </div>

      </div>
    </div>
  );
}
