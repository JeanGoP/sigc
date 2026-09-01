import { useCallback, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { fmtCOP } from "@app/utils/formattersFunctions";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { useMaximize } from "./MaximizeContext";
import { CarteraCuentaMultiSelect } from "./components/CarteraCuentaMultiSelect";
import { buildAgingChartData } from "./domain/remainingChartBuilders";
import { useAppSelector } from "@app/store/store";

export default function AgingChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const isMobile = useAppSelector((state) => state.ui.screenSize) === "xs";
  const [modo, setModo] = useState<"valor" | "cantidad">("valor");
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const chartModel = buildAgingChartData(data, ocultas, modo);
  const cuentaOptions = useMemo(
    () =>
      chartModel.chipRows.map((row) => ({
        value: row.codicta,
        label: row.desccta,
      })),
    [chartModel.chipRows],
  );
  const selectedCodictas = useMemo(
    () =>
      new Set(
        cuentaOptions
          .map((option) => option.value)
          .filter((value) => !ocultas.has(value)),
      ),
    [cuentaOptions, ocultas],
  );
  const handleSelectedChange = useCallback(
    (nextSelected: Set<string>) => {
      const all = cuentaOptions.map((option) => option.value);
      setOcultas(new Set(all.filter((value) => !nextSelected.has(value))));
    },
    [cuentaOptions],
  );

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            modo === "valor"
              ? ` ${context.dataset.label}: ${fmtCOP(context.raw as number)}`
              : ` ${context.dataset.label}: ${(context.raw as number).toLocaleString("es-CO")} obligaciones`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: modo === "valor" ? { callback: (value: any) => fmtCOP(value as number) } : {},
      },
      y: {
        stacked: true,
        ticks: { font: { size: 11 } },
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
          <h6 className="card-title text-muted mb-0">Aging de cartera</h6>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span
              style={{
                color: modo === "cantidad" ? "#4f86c6" : "#aaa",
                fontWeight: modo === "cantidad" ? 600 : 400,
              }}
            >
              Obligaciones
            </span>
            <div
              onClick={() =>
                setModo((current) => (current === "valor" ? "cantidad" : "valor"))
              }
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: modo === "valor" ? "#4f86c6" : "#ccc",
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
                  left: modo === "valor" ? 20 : 4,
                  transition: "left 0.2s",
                }}
              />
            </div>
            <span
              style={{
                color: modo === "valor" ? "#4f86c6" : "#aaa",
                fontWeight: modo === "valor" ? 600 : 400,
              }}
            >
              Saldo ($)
            </span>
          </div>
        </div>

        <small className="text-muted d-block mb-2">
          Leyenda: oculta/muestra edades.
        </small>

        <CarteraCuentaMultiSelect
          options={cuentaOptions}
          selectedValues={selectedCodictas}
          onSelectedValuesChange={handleSelectedChange}
        />

        <div
          style={{
            height: maximized
              ? "calc(100vh - 320px)"
              : /* En móvil se reduce el alto por fila y se pone un techo: sin él,
                   con muchas carteras la gráfica crecía sin límite (se veía
                   larguísima al bajar). El techo solo entra en casos extremos. */
                isMobile
                ? Math.min(chartModel.rowCount * 20 + 60, 800)
                : chartModel.rowCount * 28 + 60,
          }}
        >
          <Bar
            data={{
              labels: chartModel.labels,
              datasets: chartModel.datasets,
            }}
            options={options}
          />
        </div>
      </div>
    </div>
  );
}
