import React from "react";

interface CarteraToolbarProps {
  fecha: string;
  lastFecha: string | null;
  loading: boolean;
  error: string | null;
  cuentasExcluidasCount: number;
  hasData: boolean;
  onOpenExclusiones: () => void;
  onDescargarCsv: () => void;
  onFechaChange: (value: string) => void;
  onConsultar: () => void;
}

export const CarteraToolbar: React.FC<CarteraToolbarProps> = ({
  fecha,
  lastFecha,
  loading,
  error,
  cuentasExcluidasCount,
  hasData,
  onOpenExclusiones,
  onDescargarCsv,
  onFechaChange,
  onConsultar,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 14,
        padding: "10px 14px",
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #e8eaed",
      }}
    >
      <label style={{ fontSize: 13, color: "#666", margin: 0, whiteSpace: "nowrap" }}>
        Fecha de corte:
      </label>

      <input
        type="date"
        value={fecha}
        onChange={(event) => onFechaChange(event.target.value)}
        style={{
          fontSize: 13,
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: "4px 8px",
          outline: "none",
        }}
      />

      <button
        onClick={onConsultar}
        disabled={loading || !fecha}
        style={{
          padding: "5px 18px",
          fontSize: 13,
          fontWeight: 600,
          borderRadius: 6,
          border: "none",
          background: loading ? "#aaa" : "#4f86c6",
          color: "#fff",
          cursor: loading || !fecha ? "not-allowed" : "pointer",
          transition: "background 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {loading ? "Consultando..." : "Consultar"}
      </button>

      {lastFecha && !loading && (
        <span style={{ fontSize: 11, color: "#aaa" }}>Dataset actual: {lastFecha}</span>
      )}

      {error && <span style={{ fontSize: 12, color: "#d9534f" }}>{error}</span>}

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onDescargarCsv}
          disabled={!hasData}
          title="Descargar el dataset completo en CSV"
          aria-label="Descargar CSV"
          style={{
            width: 30,
            height: 30,
            padding: 0,
            borderRadius: 6,
            border: "1px solid #2e8b57",
            background: hasData ? "#2e8b57" : "#a9c9b6",
            color: "#fff",
            cursor: hasData ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <span style={{ fontSize: 11, color: "#999" }}>
          Excluidas: {cuentasExcluidasCount}
        </span>
        <button
          onClick={onOpenExclusiones}
          style={{
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 6,
            border: "1px solid #4f86c6",
            background: "#fff",
            color: "#4f86c6",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Configurar exclusiones
        </button>
      </div>
    </div>
  );
};
