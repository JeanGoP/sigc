import { useEffect, useMemo, useState } from "react";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";
import type {
  DashboardKpiDelta,
  DashboardKpiPanel,
  DashboardKpiMetric,
} from "./domain/kpis";
import { buildDashboardCarteraKpiPanels } from "./domain/kpis";

function DeltaBadge({
  pct,
  inverted = false,
}: DashboardKpiDelta) {
  if (pct === 0) {
    return null;
  }

  const improved = inverted ? pct < 0 : pct > 0;
  const color = improved ? "#28B463" : "#BA4A00";
  const prefix = pct > 0 ? "+" : "-";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        fontSize: 10,
        fontWeight: 600,
        color,
        background: improved ? "#eaf6ee" : "#fdecea",
        borderRadius: 4,
        padding: "1px 5px",
        marginLeft: 6,
        verticalAlign: "middle",
        lineHeight: 1.4,
      }}
    >
      {prefix} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function UnifiedMetricPanel({
  panels,
  accountOptions,
  selectedAccount,
  onSelectedAccountChange,
}: {
  panels: DashboardKpiPanel[];
  accountOptions: Array<{ label: string; value: string | number }>;
  selectedAccount: string;
  onSelectedAccountChange: (value: string) => void;
}) {
  const metrics = panels.flatMap((panel) =>
    panel.metrics.map((metric) => ({
      panelTitle: panel.title,
      panelColor: panel.color,
      metric,
    })),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const target = event.currentTarget;
    setIsDragging(true);
    setDragStartX(event.clientX);
    setDragStartScrollLeft(target.scrollLeft);
    target.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!isDragging) {
      return;
    }
    const target = event.currentTarget;
    const deltaX = event.clientX - dragStartX;
    target.scrollLeft = dragStartScrollLeft - deltaX;
  };

  const handlePointerEnd = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!isDragging) {
      return;
    }
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className="card"
      style={{ borderTop: "3px solid #4f86c6", borderRadius: 8, marginBottom: 8 }}
    >
      <div className="card-body" style={{ padding: "10px 14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Resumen cartera y recaudo
            </div>
            <div style={{ fontSize: 10, color: "#9aa0a6", marginTop: 2 }}>
              Arrastra horizontalmente para ver mas KPIs
            </div>
          </div>
          <div style={{ maxWidth: 220, minWidth: 170 }}>
            <SingleSelect
              options={accountOptions}
              selectedValue={selectedAccount}
              onChange={(value) => onSelectedAccountChange(String(value))}
              compact
            />
          </div>
        </div>
        <div
          className="kpi-drag-strip"
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: isDragging ? "none" : "auto",
            touchAction: "pan-y",
            paddingBottom: 2,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
        >
          <div style={{ display: "flex", gap: 0, minWidth: "max-content" }}>
            {metrics.map(({ panelTitle, panelColor, metric }, index) => (
            <div
              key={`${panelTitle}-${metric.label}`}
              style={{
                flex: "0 0 auto",
                minWidth: 145,
                paddingLeft: index === 0 ? 0 : 20,
                paddingRight: 20,
                borderLeft: index > 0 ? "1px solid #e8eaed" : "none",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: panelColor,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: 2,
                }}
              >
                {panelTitle}
              </div>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 1 }}>
                {metric.label}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: metric.color,
                  lineHeight: 1.2,
                }}
              >
                {metric.value}
                {metric.delta && <DeltaBadge {...metric.delta} />}
              </div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
                {metric.sub}
              </div>
            </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KpisSection({ data }: { data: CarteraRow[] }) {
  const accountOptions = useMemo(
    () =>
      data.map((row) => ({
        value: row.codicta,
        label: `${row.codicta} - ${row.desccta}`,
      })),
    [data],
  );

  const [selectedAccount, setSelectedAccount] = useState<string>("");

  useEffect(() => {
    if (accountOptions.length === 0) {
      setSelectedAccount("");
      return;
    }

    const stillExists = accountOptions.some(
      (option) => String(option.value) === String(selectedAccount),
    );
    if (!stillExists) {
      setSelectedAccount(String(accountOptions[0].value));
    }
  }, [accountOptions, selectedAccount]);

  const selectedData = useMemo(() => {
    if (!selectedAccount) {
      return [];
    }
    return data.filter((row) => String(row.codicta) === String(selectedAccount));
  }, [data, selectedAccount]);

  const panels = buildDashboardCarteraKpiPanels(selectedData);

  return (
    <UnifiedMetricPanel
      panels={panels}
      accountOptions={accountOptions}
      selectedAccount={selectedAccount}
      onSelectedAccountChange={setSelectedAccount}
    />
  );
}

