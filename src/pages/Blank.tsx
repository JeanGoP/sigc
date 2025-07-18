import { ContentHeader } from '@components';
import { Box, Typography } from '@mui/material';
import React, { ChangeEvent, useState } from 'react';
import { Table, Form, Pagination } from 'react-bootstrap';
// import { DynamicTable } from './ConsultaClientes/components/tablaReutilizables';



type dato = {
  id: number;
  name: string;
  email: string;
};
const data: dato[] = [
  { id: 1, name: 'Juan Pérez', email: 'juan@example.com' },
  { id: 2, name: 'Ana Gómez', email: 'ana@example.com' },
  { id: 3, name: 'Carlos Ruiz', email: 'carlos@example.com' },
  { id: 4, name: 'Laura Torres', email: 'laura@example.com' },
  { id: 5, name: 'Pedro Soto', email: 'pedro@example.com' },
  { id: 6, name: 'Sofía Ramírez', email: 'sofia@example.com' },
  { id: 7, name: 'Luis Méndez', email: 'luis@example.com' },
  { id: 8, name: 'Valeria Díaz', email: 'valeria@example.com' },
  { id: 9, name: 'Diego López', email: 'diego@example.com' },
  { id: 10, name: 'Camila Vega', email: 'camila@example.com' },
  { id: 11, name: 'Mateo Herrera', email: 'mateo@example.com' },
  { id: 12, name: 'Isabella Castro', email: 'isabella@example.com' },
];

const ITEMS_PER_PAGE = 5;

const Blank = () => {

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
  
  const datos: EstadoCliente[] = [
    { vencimientoCuota: '2025-06-02', cuota: 1, capital: 168392.14, interes: 163191, valorAval: 0, interesCausado: 0, devolucion: 0, valorCuota: 462000, valorDebe: 462000, diasVencidos: 0, intereses: 0 },
    { vencimientoCuota: '2025-07-02', cuota: 2, capital: 171591.59, interes: 159991.55, valorAval: 0, interesCausado: 0, devolucion: 0, valorCuota: 462000, valorDebe: 462000, diasVencidos: 0, intereses: 0 },
    { vencimientoCuota: '2025-08-02', cuota: 3, capital: 174851.83, interes: 156731.31, valorAval: 0, interesCausado: 0, devolucion: 0, valorCuota: 462000, valorDebe: 462000, diasVencidos: 0, intereses: 0 },
    // Más datos...
  ];
  
  const columnas  = [
    { id: 'vencimientoCuota', label: 'Vencimiento Cuota' },
    { id: 'cuota', label: 'Cuota' },
    { id: 'capital', label: 'Capital', format: (value: number) => value.toLocaleString() },
    { id: 'interes', label: 'Interes', format: (value: number) => value.toLocaleString() },
    { id: 'valorAval', label: 'Valor Aval' },
    { id: 'interesCausado', label: 'Interes Causado', format: (value: number) => value.toFixed(2) },
    { id: 'devolucion', label: 'Devolucion', format: (value: number) => value.toFixed(2) },
    { id: 'valorCuota', label: 'Valor Cuota', format: (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2 }) },
    { id: 'valorDebe', label: 'Valor Debe', format: (value: number) => (
        <Box
          sx={{
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '10px',
            paddingX: 1,
            display: 'inline-block',
          }}
        >
          {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Box>
    )},
    { id: 'diasVencidos', label: 'Dias Vencidos' },
    { id: 'intereses', label: 'Intereses', format: (value: number) => value.toFixed(2) },
  ];
  

  return (
    <div>
      <ContentHeader title="Blank Page" />

      <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1}>
          📢 Estado de Cliente
        </Typography>
        <Typography variant="h6" fontWeight="bold">
          #36
        </Typography>
      </Box>

      {/* <DynamicTable columns={columnas} rows={datos} /> */}
    </Box>

    </div>
  );
};

export default Blank;
