import React from 'react';
import { Box, Button } from '@mui/material';
import { StringToMoney } from '@app/utils/formattersFunctions';
import { DynamicTable, TableColumn } from './tablaReutilizables';

import { useEstadoCuentaService } from "@app/services/GetEstadoCuentaClienteFactura"; 
import { EstadoCuentaRequest } from "@app/services/GetEstadoCuentaClienteFactura";

interface Props {
  rows: any[];
  fecha: string;
  cliente: string;
  intmora: string;
  setCuotas: any;
  setFacturaFather: any;
}

export const TablaFacturas = (props: Props) => {
  // 👇 el hook va aquí, en el nivel superior del componente
  const { FetchEstadoCuentaClienteFactura, loading, error } = useEstadoCuentaService();

  const GetCuotasFactura = async (
    cuenta: string,
    factura: string,
    cliente: string,
    fecha: string,
    intmora: string
  ) => {
    props.setFacturaFather(factura);

    const request: EstadoCuentaRequest = {
      cuenta,
      fecha,
      cliente,
      factura,
      intMora: intmora,
    };

    const response: any = await FetchEstadoCuentaClienteFactura(request);

    // Log para validar la forma real del payload
    console.log('GetEstadoCuenta response =>', response);

    // Normalizar payload: aceptar array plano o ApiResponse con data
    let dataArray: any[] = [];
    if (Array.isArray(response)) {
      dataArray = response;
    } else if (Array.isArray(response?.data)) {
      dataArray = response.data;
    } else if (Array.isArray(response?.Data)) {
      // por si viene en PascalCase
      dataArray = response.Data;
    } else {
      dataArray = [];
    }

    const dataWithId = dataArray.map((item: any, index: number) => ({
      ...item,
      id: item.id ?? index + 1,
    }));

    props.setCuotas(dataWithId);
  };

  const columns: TableColumn[] = [
    {
      id: 'VIEW',
      label: 'Ver',
      format: (_value, row) => (
        <Button
          variant="contained"
          size="small"
          onClick={() =>
            GetCuotasFactura(
              row.CUENTA,
              row.NUMEFAC,
              props.cliente,
              props.fecha,
              props.intmora
            )
          }
        >
          Ver
        </Button>
      ),
    },
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
      ),
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
      ),
    },
  ];

  return (
    <DynamicTable
      columns={columns}
      rows={props.rows.map((row) => row)}
    />
  );
};
