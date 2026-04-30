import React from "react";

interface CarteraToolbarProps {
  fecha: string;
  lastFecha: string | null;
  loading: boolean;
  error: string | null;
  onFechaChange: (value: string) => void;
  onConsultar: () => void;
}

export const CarteraToolbar: React.FC<CarteraToolbarProps> = ({
  fecha,
  lastFecha,
  loading,
  error,
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
    </div>
  );
};
