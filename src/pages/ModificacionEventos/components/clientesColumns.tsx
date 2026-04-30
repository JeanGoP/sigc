import { Checkbox } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { GridColDef } from "@mui/x-data-grid";

export function buildClientesColumns(
  onSelectRow: (id: string) => void,
): GridColDef[] {
  return [
    {
      field: "select",
      headerName: "",
      width: 40,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Checkbox
          checked={params.row.selected || false}
          onChange={() => onSelectRow(String(params.row.id))}
          icon={
            <FontAwesomeIcon
              icon={faCircleCheck}
              style={{ color: "#63E6BE" }}
            />
          }
        />
      ),
    },
    { field: "id", headerName: "Identificacion", width: 150 },
    { field: "nombre", headerName: "Nombre", flex: 1, maxWidth: 550 },
    { field: "telefono", headerName: "Telefono", width: 150 },
    { field: "codIcta", headerName: "Codigo ICTA", width: 150 },
  ];
}
