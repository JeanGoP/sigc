import type { TableColumn } from "@app/pages/ConsultaClientes/components/tablaReutilizables";
import { getAgeBadgeStyle } from "@app/constants/ageBuckets";

type ConsultaCarteraSidebarRow = Record<string, unknown>;

interface BuildConsultaCarteraSidebarColumnsOptions {
  onBuscarRow: (row: ConsultaCarteraSidebarRow) => void;
}

export function buildConsultaCarteraSidebarColumns({
  onBuscarRow,
}: BuildConsultaCarteraSidebarColumnsOptions): TableColumn[] {
  const readDisplayValue = (value: unknown) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : "-";
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }

    return "-";
  };

  return [
    {
      id: "buscar",
      label: "",
      format: (_value, row) => (
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color: "#1565c0",
            fontSize: 18,
          }}
          title="Buscar"
          onClick={() => onBuscarRow(row as ConsultaCarteraSidebarRow)}
        >
          <i className="fas fa-search" />
        </button>
      ),
    },
    { id: "cliente", label: "Cliente" },
    {
      id: "estadoGestion",
      label: "",
      format: (_value, row) => (
        <span
          style={{
            background: row.colorEstadoGestion || "#eee",
            display: "inline-block",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            margin: "auto",
          }}
        />
      ),
    },
    {
      id: "RAZONCIAL",
      label: "Razón Social",
    },
    { id: "cuenta", label: "Cuenta" },
    {
      id: "EDAD",
      label: "Edad",
      format: (value) => {
        const badge = getAgeBadgeStyle(value);
        return (
          <span
            style={{
              background: badge.fillColor,
              color: badge.textColor,
              borderRadius: "4px",
              padding: "2px 8px",
              display: "inline-block",
              minWidth: 40,
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {readDisplayValue(value)}
          </span>
        );
      },
    },
  ];
}
