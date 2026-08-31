import { useCallback, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { fmtCOP } from "@app/utils/formattersFunctions";
import { useMaximize } from "./MaximizeContext";
import { CarteraCuentaMultiSelect } from "./components/CarteraCuentaMultiSelect";
import {
  buildComposicionRecaudoChartData,
} from "./domain/chartBuilders";

const fmtPct = (value: number) => `${value.toFixed(1)}%`;

export default function ComposicionRecaudoChart({ data }: { data: CarteraRow[] }) {
  const maximized = useMaximize();
  const [modoPorc, setModoPorc] = useState(false);
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const chartModel = buildComposicionRecaudoChartData(
    data,
    ocultas,
    modoPorc ? "porcentaje" : "valor",
  );
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
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            modoPorc
              ? ` ${context.label}: ${fmtPct(context.raw as number)}`
              : ` ${context.label}: ${fmtCOP(context.raw as number)}`,
        },
      },
    },
  };

  return (
    <div className="card h-100">
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
          <h6 className="card-title text-muted mb-0">De donde viene el recaudo?</h6>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
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

        <CarteraCuentaMultiSelect
          options={cuentaOptions}
          selectedValues={selectedCodictas}
          onSelectedValuesChange={handleSelectedChange}
        />

        <div style={{ height: maximized ? "calc(100vh - 280px)" : 240 }}>
          <Doughnut
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
