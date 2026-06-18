import { useState } from "react";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import type {
  DashboardKpiDelta,
  DashboardKpiPanel,
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
}: {
  panels: DashboardKpiPanel[];
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
  const panels = buildDashboardCarteraKpiPanels(data);

  return (
    <UnifiedMetricPanel
      panels={panels}
    />
  );
}

