import React from "react";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";

interface ConsultaCarteraGestionFabProps {
  hasActiveGestionInContext: boolean;
  gestionStatusLabel: string;
  gestionElapsedLabel: string;
  gestionOperativaActiva: boolean;
  fabDisabled: boolean;
  loadingStartGestionSession: boolean;
  isSwitchingGestionContext: boolean;
  fabLabel: string;
  onFabClick: () => void;
}

export function ConsultaCarteraGestionFab({
  hasActiveGestionInContext,
  gestionStatusLabel,
  gestionElapsedLabel,
  gestionOperativaActiva,
  fabDisabled,
  loadingStartGestionSession,
  isSwitchingGestionContext,
  fabLabel,
  onFabClick,
}: ConsultaCarteraGestionFabProps) {
  return (
    <div className="gestion-session-floating-wrap">
      {hasActiveGestionInContext && (
        <div className="gestion-session-active-pill">
          <div className="gestion-session-active-pill-title">
            <FontAwesomeIcon icon={faClock} /> Gestion activa ({gestionStatusLabel})
          </div>
          <div className="gestion-session-active-pill-time">{gestionElapsedLabel}</div>
        </div>
      )}
      <Button
        className="gestion-session-fab"
        variant={gestionOperativaActiva ? "success" : "primary"}
        disabled={fabDisabled}
        onClick={onFabClick}
      >
        {loadingStartGestionSession
          ? "Iniciando..."
          : isSwitchingGestionContext
            ? "Procesando..."
            : fabLabel}
      </Button>
    </div>
  );
}
