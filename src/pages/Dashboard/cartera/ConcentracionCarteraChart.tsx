import { Doughnut } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";

const COLORS = [
  "#4f86c6","#6ab187","#f0ad4e","#e67e22","#d9534f",
  "#8e44ad","#16a085","#2980b9","#c0392b","#d35400","#95a5a6",
];
import { fmtCOP } from "@app/utils/formattersFunctions";

export default function ConcentracionCarteraChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const sorted = [...data].sort((a, b) => b.total - a.total);
  const top10  = sorted.slice(0, 10);
  const otros  = sorted.slice(10).reduce((s, r) => s + r.total, 0);

  const labels = [...top10.map((r) => r.desccta), "Otras"];
  const values = [...top10.map((r) => r.total), otros];

  const chartData = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: COLORS,
      borderWidth: 0,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const, labels: { font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${fmtCOP(ctx.raw as number)}`,
        },
      },
    },
  };

  return (
    <div className="card h-100">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">Concentración de cartera (top 10)</h6>
        <div style={{ height: maximized ? "calc(100vh - 160px)" : 280 }}>
          <Doughnut data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}
