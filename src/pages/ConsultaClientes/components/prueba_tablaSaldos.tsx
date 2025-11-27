import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box } from '@mui/material';
import { DynamicTable, TableColumn } from './tablaReutilizables';
import { StringToMoney } from '@app/utils/formattersFunctions';

interface EstadoCliente {
  vencimientoCuota: string;
  cuota: number;
  capital: number;
  interes: number;
  valorAval: number;
  interesCausado: number;
  devolucion: number;
  valorCuota: number;
  valorDebe: number;
  diasVencidos: number;
  intereses: number;
}


const EstadoClienteTable = (props: any) => {
  const columns_saldos: TableColumn[] = [
    { id: "VENCFAC", label: "Vencimiento Cuota" },
    {
      id: "VALOR_CUOTA",
      label: "Valor Cuota",
      format: (value: any) =>
        `$ ${StringToMoney(value)}`
    },
    {
      id: "DEBE",
      label: "Valor Debe",
      format: (value: any, row?: any) => (
        <Box
          sx={{
            backgroundColor: row?.ColorCodigo || "gray",
            color: "#fff",
            borderRadius: "4px",
            width: "100%",
            textAlign: "center",
          }}
        >
          $ {StringToMoney(value)}
        </Box>
      ),
    },
    {
      id: "DIAS",
      label: "Dias vencidos",
      align: "center",
      // format: (value: any) => `$ ${StringToMoney(value)}`
    },
    {
      id: "MORA",
      label: "Int. Mora",
      align: "center",
      format: (value: any) => `$ ${StringToMoney(value)}`
    },
  ];



  return (
    <Box>
      <div className="row" style={{ marginTop: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '9px' }}>
        {/* <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1}>
          📢 Estado de Cliente
        </Typography> */}
        <Typography
                  variant="h5"
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  fontFamily="Roboto, Helvetica, Arial, sans-serif"
                  gap={1}
                  sx={{ color: "black", mb: 1 }}
                >
                  <Box
                    component="i"
                    className="<zdummy>"
                    aria-hidden="true"
                    sx={{
                      fontSize: 28,
                      color: "primary.main",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                  <span>Cuotas</span>
                </Typography>
        <Typography variant="h6" fontWeight="bold">
          {"#" + props.numCuotas}
        </Typography>

        </div>
      <DynamicTable columns={columns_saldos} rows={props.rows.map((row: any) => {
        // Aquí pasas la fila completa a las funciones de formato sin necesidad de agregar el campo __row__
        return row;
      })} />
    </Box>
  );
};

export default EstadoClienteTable;
