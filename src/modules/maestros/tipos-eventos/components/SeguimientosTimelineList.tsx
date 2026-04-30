import type { ReactElement } from "react";
import type { Evento, Seguimiento } from "../domain/types";
import { SeguimientoCard } from "./SeguimientoCard";

interface SeguimientosTimelineListProps {
  seguimientos: Seguimiento[];
  parseEventos: (eventos: string | Evento[]) => Evento[];
  renderTooltip: (evento: Evento, idx?: number) => ReactElement;
  onAudio: (seguimiento: Seguimiento) => void;
  onVerMas: (seguimiento: Seguimiento) => void;
}

export function SeguimientosTimelineList({
  seguimientos,
  parseEventos,
  renderTooltip,
  onAudio,
  onVerMas,
}: SeguimientosTimelineListProps) {
  return (
    <div style={{ height: "75vh", overflowY: "auto", paddingRight: 12 }}>
      <div style={{ position: "relative" }}>
        {seguimientos.map((seguimiento, index) => (
          <div
            key={seguimiento.id}
            style={{ marginBottom: 32, position: "relative" }}
          >
            {index < seguimientos.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 7,
                  top: 24,
                  bottom: -32,
                  width: 2,
                  background: "#e0e0e0",
                  zIndex: 0,
                }}
              />
            )}

            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                zIndex: 1,
              }}
            >
              <span
                style={{
                  background: "#1565c0",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  display: "inline-block",
                  border: "2px solid #fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              />
            </div>

            <SeguimientoCard
              seguimiento={seguimiento}
              parseEventos={parseEventos}
              renderTooltip={renderTooltip}
              onAudio={onAudio}
              onVerMas={onVerMas}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
