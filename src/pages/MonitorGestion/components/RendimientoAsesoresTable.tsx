import { DynamicTable, type TableColumn } from "@app/pages/ConsultaClientes/components/tablaReutilizables";
import type { ProductividadAsesorDto } from "@models/ProductividadAsesorDto";

interface RendimientoAsesoresTableProps {
  columns: TableColumn[];
  rows: ProductividadAsesorDto[];
}

export function RendimientoAsesoresTable({
  columns,
  rows,
}: RendimientoAsesoresTableProps) {
  if (rows.length === 0) {
    return null;
  }

  return <DynamicTable columns={columns} rows={rows} showFooter={true} />;
}
