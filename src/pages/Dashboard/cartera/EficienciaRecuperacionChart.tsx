import { Scatter } from "react-chartjs-2";
import { fmtCOP } from "@app/utils/formattersFunctions";
import { ScatterController } from "chart.js";
import { Chart as ChartJS } from "chart.js";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";

ChartJS.register(ScatterController);

export default function EficienciaRecuperacionChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const conDatos = data.filter((r) => r.carteraVencida > 0 && r.recaudoMesActual > 0);

  const chartData = {
    datasets: [{
      label: "Carteras",
      data: conDatos.map((r) => ({
        x: r.carteraVencida / 1_000_000,
        y: r.recaudoMesActual / 1_000_000,
        label: r.desccta,
      })),
      backgroundColor: "#4f86c6cc",
      pointRadius: 7,
      pointHoverRadius: 9,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            `${ctx.raw.label} — Vencida: ${fmtCOP(ctx.raw.x * 1_000_000)} | Recaudo: ${fmtCOP(ctx.raw.y * 1_000_000)}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Cartera vencida ($M)" },
        ticks: { callback: (v: any) => `$${v}M` },
      },
      y: {
        title: { display: true, text: "Recaudo mes actual ($M)" },
        ticks: { callback: (v: any) => `$${v}M` },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">
          Eficiencia de recuperación — Vencida vs Recaudo
        </h6>
        <div style={{ height: maximized ? "calc(100vh - 160px)" : 320 }}>
          <Scatter data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}
