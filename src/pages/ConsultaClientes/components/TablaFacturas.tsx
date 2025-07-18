// import React from 'react';
// import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
// import { Box } from '@mui/material';
// import { StringToMoney } from '@app/utils/formattersFunctions';

// interface Props {
//   rows: any[];
// }

// const columns: GridColDef[] = [
//   { field: 'NUMEFAC', headerName: 'NUMEFAC', minWidth: 130, flex: 1 },
//   { field: 'IDCLIPRV', headerName: 'IDCLIPRV', minWidth: 130, flex: 1 },
//   { field: 'SACT', headerName: 'SACT', minWidth: 130, flex: 1, renderCell: (params: GridRenderCellParams) => (
//     <Box
//         sx={{
//           backgroundColor: params.row.ColorCodigo,
//           color: '#fff',
//         //   padding: '4px 8px',
//           borderRadius: '4px',
//           width: '100%',
//           textAlign: 'center',
          
//         }}
//       >
//         $ {StringToMoney(params.value)}
//       </Box>
//   ), },
//   { field: 'CUOTAS', headerName: 'CUOTAS', minWidth: 100, flex: 1 },
//   { field: 'MIN_VENC', headerName: 'MIN_VENC', minWidth: 130, flex: 1 },
//   { field: 'DIAS', headerName: 'DIAS', minWidth: 80, flex: 1 },
//   {
//     field: 'EDAD',
//     headerName: 'EDAD',
//     width: 100,
//     renderCell: (params: GridRenderCellParams) => (
//       <Box
//         sx={{
//           backgroundColor: params.row.ColorCodigo,
//           color: '#fff',
//         //   padding: '4px 8px',
//           borderRadius: '4px',
//           width: '100%',
//           textAlign: 'center',
          
//         }}
//       >
//         {params.value}
//       </Box>
//     ),
//   },
// ];



// export const TablaFacturas = (props : Props) => {
//   return (
//     <div style={{ height: 400, width: '100%' }}>
//       <DataGrid
//         rows={props.rows}
//         columnHeaderHeight={45}
//         columns={columns}
//         rowHeight={40}
//         // pageSizeOptions={[5]}
//         autoPageSize
//         autoHeight
//         disableColumnFilter
        
//         disableRowSelectionOnClick
//         hideFooter
//         hideFooterPagination
        
//       />
//     </div>
//   );
// };


import React from 'react';
import { Box, Button } from '@mui/material';
import { StringToMoney } from '@app/utils/formattersFunctions';
import { DynamicTable, TableColumn } from './tablaReutilizables';
import { EstadoCuentaRequest, FetchEstadoCuentaClienteFactura } from '@app/services/GetEstadoCuentaClienteFactura';

interface Props {
  rows: any[];
  fecha: string;
  cliente: string;
  intmora: string;
  setCuotas: any
  setFacturaFather: any
}





export const TablaFacturas = (props: Props) => {

  const GetCuotasFactura = async (cuenta: string,factura: string,cliente:string, fecha:string, intmora: string) => {

    props.setFacturaFather(factura);

    const request:EstadoCuentaRequest  = {
      cuenta: cuenta,
      fecha: fecha,
      cliente: cliente,
      factura: factura,
      intMora: intmora
    };
    const x: any = await FetchEstadoCuentaClienteFactura(request);
    
    const dataWithId = x.map((item: any, index: number) => ({
      ...item,
      id: item.id ?? index + 1,
    }));

    console.log('x', x);

    if (!dataWithId || !Array.isArray(dataWithId)) {
      return <div>No data available</div>;
    }

    props.setCuotas(dataWithId);
  }

  const columns: TableColumn[] = [
    { id: 'VIEW', label: 'Ver', format: (_value, row) => (
      <Button
        variant="contained"
        size="small"
        onClick={() => GetCuotasFactura(row.CUENTA,row.NUMEFAC, props.cliente, props.fecha,props.intmora)}
      >
        Ver
      </Button>
    ) },
    { id: 'CUENTA', label: 'Cuenta' },
    { id: 'NUMEFAC', label: 'Factura' },
    { id: 'IDCLIPRV', label: 'Cliente' },
    { 
      id: 'SACT', 
      label: 'Saldo Actual', 
      format: (value: any, row?: any) => (
        <Box
          sx={{
            backgroundColor: row?.ColorCodigo || 'gray',
            color: '#fff',
            borderRadius: '4px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          $ {StringToMoney(value)}
        </Box>
      ) 
    },
    { id: 'CUOTAS', label: 'Cuotas' },
    { id: 'MIN_VENC', label: 'Vencido' },
    { id: 'DIAS', label: 'Días' },
    { 
      id: 'EDAD', 
      label: 'Edad', 
      format: (value: any, row?: any) => (
        <Box
          sx={{
            backgroundColor: row?.ColorCodigo || 'gray',
            color: '#fff',
            borderRadius: '4px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {value}
        </Box>
      )
    },
  ];

  return (
    <DynamicTable 
      columns={columns}
      rows={props.rows.map((row) => {
        // Aquí pasas la fila completa a las funciones de formato sin necesidad de agregar el campo __row__
        return row;
      })}
    />
  );
};
