import { Checkbox } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import type { GridColDef } from "@mui/x-data-grid";

interface BuildConsultaClientesColumnsInput {
  onSelectRow: (id: string) => void;
}

export function buildConsultaClientesColumns({
  onSelectRow,
}: BuildConsultaClientesColumnsInput): GridColDef[] {
  return [
    {
      field: "select",
      headerName: "",
      width: 40,
      minWidth: 20,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Checkbox
          checked={params.row.selected || false}
          onChange={() => onSelectRow(String(params.row.id))}
          icon={<FontAwesomeIcon icon={faCircleCheck} style={{ color: "#63E6BE" }} />}
        />
      ),
    },
    { field: "id", headerName: "Identificación", width: 150 },
    { field: "nombre", headerName: "Nombre", flex: 1, maxWidth: 550 },
    { field: "telefono", headerName: "Teléfono", width: 150 },
    { field: "codIcta", headerName: "Código ICTA", width: 150 },
  ];
}
