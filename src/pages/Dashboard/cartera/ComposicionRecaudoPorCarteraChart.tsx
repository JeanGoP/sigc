import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Doughnut } from "react-chartjs-2";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { buildComposicionRecaudoChartData } from "./domain/chartBuilders";
import { buildComposicionRecaudoPorCarteraChartData } from "./domain/remainingChartBuilders";

export default function ComposicionRecaudoPorCarteraChart({
  data,
}: {
  data: CarteraRow[];
}) {
  const maximized = useMaximize();
  const [modoPorc, setModoPorc] = useState(true);
  const [tipoGrafico, setTipoGrafico] = useState<"barras" | "dona">("barras");
  const [carteraDona, setCarteraDona] = useState<string>("__TOTAL__");
  const chartModelBarras = buildComposicionRecaudoPorCarteraChartData(
    data,
    new Set(),
    modoPorc ? "porcentaje" : "valor",
  );
  const cuentaOptions = useMemo(
    () =>
      chartModelBarras.chipRows.map((row) => ({
        value: row.codicta,
        label: row.desccta,
      })),
    [chartModelBarras.chipRows],
  );
  const cuentasDisponibles = useMemo(
    () => cuentaOptions.map((option) => option.value),
    [cuentaOptions],
  );

  useEffect(() => {
    if (carteraDona === "__TOTAL__") {
      return;
    }

    if (!cuentasDisponibles.includes(carteraDona)) {
      setCarteraDona("__TOTAL__");
    }
  }, [carteraDona, cuentasDisponibles]);

  const chartModelDona = useMemo(() => {
    const mode = modoPorc ? "porcentaje" : "valor";

    if (carteraDona === "__TOTAL__") {
      return buildComposicionRecaudoChartData(data, new Set(), mode);
    }

    const row = data.find((item) => item.codicta === carteraDona);
    return buildComposicionRecaudoChartData(row ? [row] : [], new Set(), mode);
  }, [carteraDona, data, modoPorc]);

  const optionsBarras = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            modoPorc
              ? ` ${context.dataset.label}: ${(context.raw as number).toFixed(1)}%`
              : ` ${context.dataset.label}: ${fmtCOP(context.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ...(modoPorc ? { min: 0, max: 100 } : { beginAtZero: true }),
        ticks: {
          callback: (value: any) =>
            modoPorc ? `${value}%` : fmtCOP(value as number),
        },
      },
      y: {
        stacked: true,
        ticks: { font: { size: 11 } },
      },
    },
  };

  const optionsDona = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            modoPorc
              ? ` ${context.label}: ${(context.raw as number).toFixed(1)}%`
              : ` ${context.label}: ${fmtCOP(context.raw as number)}`,
        },
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
          <h6 className="card-title text-muted mb-0">
            Composicion del recaudo por cartera
          </h6>

          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {(["barras", "dona"] as const).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setTipoGrafico(tipo)}
                  style={{
                    padding: "2px 10px",
                    fontSize: 11,
                    borderRadius: 12,
                    border: "1px solid",
                    borderColor: tipoGrafico === tipo ? "#4f86c6" : "#ddd",
                    background: tipoGrafico === tipo ? "#4f86c6" : "#fff",
                    color: tipoGrafico === tipo ? "#fff" : "#666",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {tipo === "barras" ? "Barras" : "Dona"}
                </button>
              ))}
            </div>

            <span
              style={{
                color: !modoPorc ? "#4f86c6" : "#aaa",
                fontWeight: !modoPorc ? 600 : 400,
              }}
            >
              $
            </span>
            <div
              onClick={() => setModoPorc((current) => !current)}
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: modoPorc ? "#4f86c6" : "#ccc",
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
                  left: modoPorc ? 20 : 4,
                  transition: "left 0.2s",
                }}
              />
            </div>
            <span
              style={{
                color: modoPorc ? "#4f86c6" : "#aaa",
                fontWeight: modoPorc ? 600 : 400,
              }}
            >
              %
            </span>
          </div>
        </div>

        <small className="text-muted d-block mb-2">
          El filtro global de carteras se aplica a esta visualización.
        </small>

        {tipoGrafico === "dona" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 11, color: "#aaa" }}>Cartera:</span>
            <select
              value={carteraDona}
              onChange={(event) => setCarteraDona(event.target.value)}
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 8,
                border: "1px solid #d0d5dd",
                color: "#344054",
                background: "#fff",
              }}
            >
              <option value="__TOTAL__">Total</option>
              {cuentasDisponibles.map((codicta) => {
                const label = cuentaOptions.find((option) => option.value === codicta)
                  ?.label ?? codicta;
                return (
                  <option key={codicta} value={codicta}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div
          style={{
            height: maximized
              ? "calc(100vh - 320px)"
              : tipoGrafico === "barras"
                ? chartModelBarras.rowCount * 28 + 60
                : 280,
          }}
        >
          {tipoGrafico === "barras" ? (
            <Bar
              data={{
                labels: chartModelBarras.labels,
                datasets: chartModelBarras.datasets,
              }}
              options={optionsBarras}
            />
          ) : (
            <Doughnut
              data={{
                labels: chartModelDona.labels,
                datasets: chartModelDona.datasets,
              }}
              options={optionsDona}
            />
          )}
        </div>
      </div>
    </div>
  );
}
