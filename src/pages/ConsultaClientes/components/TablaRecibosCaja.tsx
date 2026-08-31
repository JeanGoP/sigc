// components/RecibosCajaTable.tsx

import React, { useState } from 'react';
import { DynamicTable, TableColumn } from './tablaReutilizables';
import { ReciboCajaListModel } from '@app/models/recibocaja/recibocajaListoModel';
import { StringToMoney } from '@app/utils/formattersFunctions';
import { Box, Button } from '@mui/material';
import VerAsientoContableTable from '@app/components/Contabilidad/VerAsientoContableTable';

interface RecibosCajaTableProps {
  rows: any[];
}
export const RecibosCajaTable: React.FC<RecibosCajaTableProps> = ({ rows }) => {

  const [openVerAsiento, setOpenVerAsiento] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const handler = (row:ReciboCajaListModel) => {
    setSelectedRow(row); setOpenVerAsiento(true);
  }

  const columns: TableColumn[] = [
    {
      id: 'id',
      label: 'Documento',
      align: 'center',
      format: (_value, row) => (
        <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={() => handler(row)}
        sx={{
          textTransform: 'none',
          borderRadius: 999,
          px: 1.5,
          py: 0.3,
          fontWeight: 600,
          gap: 1,
          minWidth: 0,
          lineHeight: 1.4,
          '&:hover': {
            boxShadow: '0 0 0 2px rgba(25,118,210,0.08)'
          }
        }}
        startIcon={
            <Box
              component="i"
              className="fas fa-file-invoice-dollar"
              aria-hidden="true"
              sx={{ fontSize: 14, color: 'primary.main' }}
            />
          }
        >
          {row.id}
        </Button>
      ),
    },
    {id: 'DESFUENTE', label: 'Fuente'},
    {id: 'FORMAPAGO', label: 'Forma de Pago'},
    { id: 'VENCEFAC', label: 'Fecha vencimiento' },
    { id: 'FECHATRA', label: 'Fecha documento' },
    { id: 'VALOR', label: 'Valor Pagado', align: 'center', format: (value) => `$ ${StringToMoney(value)}` },
  ];

  return (


    <>
      <DynamicTable
        columns={columns}
        rows={rows}
        showTittle={true}
        tittle={{ tittleText: 'Recibos de Caja', iconClass: 'fas fa-receipt' }}
        enableMobileCards
      />
      {openVerAsiento && selectedRow && (
        <Box mt={2}>
          <VerAsientoContableTable
            numDocutra={selectedRow.id}
            idFuente={selectedRow.DESFUENTE}
            tercero={selectedRow.TERCERO}
            onClose={() => setOpenVerAsiento(false)}
          />
        </Box>
      )}
    </>
  );
};
