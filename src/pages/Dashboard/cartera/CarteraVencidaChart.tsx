import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { type Plugin } from "chart.js";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { buildCarteraVencidaChartData } from "./domain/remainingChartBuilders";
import { useAppSelector } from "@app/store/store";

const umbralPlugin: Plugin<"bar"> = {
  id: "umbralLine",
  afterDraw(chart, _args, options: any) {
    const {
      ctx,
      chartArea: { top, bottom },
      scales: { x },
    } = chart;
    const xPos = x.getPixelForValue(options.value);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xPos, top);
    ctx.lineTo(xPos, bottom);
    ctx.strokeStyle = options.color ?? "#BA4A00";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();
  },
};

export default function CarteraVencidaChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const isMobile = useAppSelector((state) => state.ui.screenSize) === "xs";
  const [umbral, setUmbral] = useState(15);
  const [inputVal, setInputVal] = useState("15");
  const chartModel = buildCarteraVencidaChartData(data, new Set(), umbral);

  const handleUmbralChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(event.target.value);
    const value = parseFloat(event.target.value);

    if (!Number.isNaN(value) && value >= 0 && value <= 100) {
      setUmbral(value);
    }
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${(context.raw as number).toFixed(2)}%`,
        },
      },
      umbralLine: { value: umbral, color: "#BA4A00" },
    } as any,
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (value: any) => `${value}%` },
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
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <h6 className="card-title text-muted mb-0">% Cartera vencida por cartera</h6>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: "#aaa" }}>Umbral critico:</span>
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

        <div
          style={{
            height: maximized
              ? "calc(100vh - 320px)"
              : /* Móvil: menos alto por fila y techo, para que no crezca sin
                   límite con muchas carteras. */
                isMobile
                ? Math.min(chartModel.rowCount * 20 + 40, 800)
                : chartModel.rowCount * 28 + 40,
          }}
        >
          <Bar
            data={{
              labels: chartModel.labels,
              datasets: chartModel.datasets,
            }}
            options={options}
            plugins={[umbralPlugin]}
          />
        </div>
      </div>
    </div>
  );
}
