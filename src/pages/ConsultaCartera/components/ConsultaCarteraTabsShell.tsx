import React from "react";
import { OverlayTrigger, Tab, Tabs, Tooltip } from "react-bootstrap";

interface ConsultaCarteraTabsShellProps {
  activeTab: string;
  selectedFacturaLabel: string;
  hasFullSelection: boolean;
  infoContent: React.ReactNode;
  seguimientoContent: React.ReactNode;
  bitacoraContent: React.ReactNode;
  onSelect: (nextTab: string) => void;
}

export function ConsultaCarteraTabsShell({
  activeTab,
  selectedFacturaLabel,
  hasFullSelection,
  infoContent,
  seguimientoContent,
  bitacoraContent,
  onSelect,
}: ConsultaCarteraTabsShellProps) {
  return (
    <Tabs
      activeKey={activeTab}
      onSelect={(nextTab) => onSelect(nextTab || "info")}
      id="tabs"
      className="mb-3"
    >
      <Tab
        eventKey="facturaActual"
        title={<strong>{selectedFacturaLabel || "No seleccionado"}</strong>}
        disabled
      />
      <Tab eventKey="info" title="Información General">
        {infoContent}
      </Tab>
      <Tab
        eventKey="seguimiento"
        title={
          <span>
            Seguimiento
            {!hasFullSelection && (
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip-seguimiento">
                    Seleccione cliente, factura y cuenta para ver sus seguimientos
                  </Tooltip>
                }
              >
                <span style={{ marginLeft: "5px", color: "#999" }}>
                  <i className="fas fa-lock" />
                </span>
              </OverlayTrigger>
            )}
          </span>
        }
        disabled={!hasFullSelection}
      >
        {seguimientoContent}
      </Tab>
      <Tab eventKey="bitacora" title="Bitácora" disabled={!hasFullSelection}>
        {bitacoraContent}
      </Tab>
    </Tabs>
  );
}
