import { Bar } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";

export default function IndiceRecaudoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const conIndice = [...data]
    .filter((r) => r.indiceRecaudo > 0)
    .sort((a, b) => b.indiceRecaudo - a.indiceRecaudo);

  const chartData = {
    labels: conIndice.map((r) => r.desccta),
    datasets: [{
      label: "Índice de recaudo %",
      data: conIndice.map((r) => r.indiceRecaudo),
      backgroundColor: conIndice.map((r) =>
        r.indiceRecaudo >= 15 ? "#6ab187" :
        r.indiceRecaudo >= 8  ? "#4f86c6" : "#f0ad4e"
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
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { callback: (v: any) => `${v}%` },
      },
      y: { ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="card">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">Índice de recaudo por cartera (%)</h6>
        <div style={{ height: maximized ? "calc(100vh - 160px)" : conIndice.length * 28 + 40 }}>
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}
