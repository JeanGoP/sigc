import type { TableColumn } from "@app/pages/ConsultaClientes/components/tablaReutilizables";

type ConsultaCarteraSidebarRow = Record<string, unknown>;

interface BuildConsultaCarteraSidebarColumnsOptions {
  onBuscarRow: (row: ConsultaCarteraSidebarRow) => void;
}

export function buildConsultaCarteraSidebarColumns({
  onBuscarRow,
}: BuildConsultaCarteraSidebarColumnsOptions): TableColumn[] {
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
      format: (value, row) => (
        <span
          style={{
            background: row.ColorCodigo || "#eee",
            color: "#fff",
            borderRadius: "4px",
            padding: "2px 8px",
            display: "inline-block",
            minWidth: 40,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {value}
        </span>
      ),
    },
  ];
}
