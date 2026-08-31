import type { ReactElement } from "react";
import { Button } from "react-bootstrap";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { IconMap } from "@app/services/IconMap";
import type { Evento, Seguimiento } from "../domain/types";
import { getEventoCumplidoState } from "../utils/cumplido";

interface SeguimientoCardProps {
  seguimiento: Seguimiento;
  parseEventos: (eventos: string | Evento[]) => Evento[];
  renderTooltip: (evento: Evento, idx?: number) => ReactElement;
  onAudio: (seguimiento: Seguimiento) => void;
  onVerMas: (seguimiento: Seguimiento) => void;
}

export function SeguimientoCard({
  seguimiento,
  parseEventos,
  renderTooltip,
  onAudio,
  onVerMas,
}: SeguimientoCardProps) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        minWidth: 250,
        position: "relative",
        marginLeft: 24,
        border: "1px solid #e0e0e0",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontWeight: "bold",
              color: "#1565c0",
              fontSize: 16,
            }}
          >
            {seguimiento.usuario}
          </div>
          <span style={{ fontSize: 13, color: "#adb5bd", fontWeight: 400 }}>
            #{seguimiento.id}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginLeft: 16,
          }}
        >
          {seguimiento.eventos &&
            parseEventos(seguimiento.eventos).map((evento, idx) => {
              const cumplidoState = getEventoCumplidoState(evento.cumplido);

              return (
                <OverlayTrigger
                  key={idx}
                  placement="top"
                  overlay={renderTooltip(evento, idx)}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: evento.color,
                        fontSize: 20,
                        cursor: "pointer",
                        opacity: cumplidoState === "done" ? 0.5 : 1,
                        marginLeft: 4,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={IconMap[evento.icono || "home"]}
                        color={evento.color}
                      />
                    </span>
                  </span>
                </OverlayTrigger>
              );
            })}
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#666",
          marginBottom: 8,
        }}
      >
        {seguimiento.fecha} {seguimiento.hora}
      </div>

      <div
        style={{
          margin: "12px 0",
          color: "#333",
          lineHeight: 1.5,
        }}
      >
        {seguimiento.texto.length > 80
          ? seguimiento.texto.slice(0, 80) + "..."
          : seguimiento.texto}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          variant="primary"
          onClick={() => onVerMas(seguimiento)}
          style={{ borderRadius: 6 }}
        >
          Ver más
        </Button>
        {seguimiento.grabacion && (
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => onAudio(seguimiento)}
            style={{ borderRadius: 6 }}
          >
            <FontAwesomeIcon icon={faMicrophone} style={{ marginRight: 4 }} />
            Escuchar
          </Button>
        )}
      </div>
    </div>
  );
}
