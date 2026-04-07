import { Bar } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";

export default function AgingObligacionesChart({ data }: { data: CarteraRow[] }) {
  const sorted = [...data]
    .filter((r) => r.obligacionesTotal > 0)
    .sort((a, b) => b.obligacionesTotal - a.obligacionesTotal);

  const chartData = {
    labels: sorted.map((r) => r.desccta),
    datasets: [
      { label: "Por vencer", data: sorted.map((r) => r.obligacionesPV),    backgroundColor: "#6ab187" },
      { label: "30 días",    data: sorted.map((r) => r.obligaciones30),    backgroundColor: "#4f86c6" },
      { label: "60 días",    data: sorted.map((r) => r.obligaciones60),    backgroundColor: "#f0ad4e" },
      { label: "90 días",    data: sorted.map((r) => r.obligaciones90),    backgroundColor: "#e67e22" },
      { label: "+90 días",   data: sorted.map((r) => r.obligaciones90mas), backgroundColor: "#d9534f" },
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
            ` ${ctx.dataset.label}: ${(ctx.raw as number).toLocaleString("es-CO")} clientes`,
        },
      },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="card">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">Aging por número de clientes</h6>
        <div style={{ height: sorted.length * 28 + 60 }}>
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}
