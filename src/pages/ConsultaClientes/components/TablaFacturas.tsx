import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { getAgeBadgeStyle } from "@app/constants/ageBuckets";
import { StringToMoney } from "@app/utils/formattersFunctions";
import { DynamicTable, TableColumn } from "./tablaReutilizables";

import { useEstadoCuentaService } from "@app/services/GetEstadoCuentaClienteFactura";
import { EstadoCuentaRequest } from "@app/services/GetEstadoCuentaClienteFactura";

interface Props {
  rows: any[];
  fecha: string;
  cliente: string;
  intmora: string;
  setCuotas: any;
  setFacturaFather: any;
  onSelectFactura?: (row: any) => void;
}

export const TablaFacturas = (props: Props) => {
  // 👇 el hook va aquí, en el nivel superior del componente
  const { FetchEstadoCuentaClienteFactura, loading, error } =
    useEstadoCuentaService();

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

  const buildAgeSx = (ageValue: unknown) => {
    const badge = getAgeBadgeStyle(ageValue);
    return {
      backgroundColor: badge.fillColor,
      color: badge.textColor,
      borderRadius: "4px",
      width: "100%",
      textAlign: "center" as const,
    };
  };

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
      id: "VIEW",
      label: "Ver",
      format: (_value, row) => (
        <i
          className="fas fa-eye"
          style={{ cursor: "pointer", color: "#1976d2", fontSize: "18px" }}
          onClick={() => {
            props.onSelectFactura?.({
              ...row,
              cliente: row?.cliente ?? row?.CLIENTE ?? props.cliente,
            });
            GetCuotasFactura(
              row.CUENTA,
              row.NUMEFAC,
              props.cliente,
              props.fecha,
              props.intmora
            );
          }}
        ></i>
      ),
    },
    { id: "CUENTA", label: "Cuenta" },
    { id: "NUMEFAC", label: "Factura" },
    // { id: "IDCLIPRV", label: "Cliente" },
    {
      id: "SACT",
      label: "Saldo Actual",
      format: (value: any, row?: any) => <Box>$ {StringToMoney(value)}</Box>,
    },
    {
      id: "SACTMORA",
      label: "Saldo Mora",
      format: (value: any, row?: any) => (
        <Box sx={buildAgeSx(row?.EDAD)}>
          $ {StringToMoney(value)}
        </Box>
      ),
    },
    {
      id: "VALMORA",
      label: "Int. Mora",
      format: (value: any, row?: any) => (
        <Box sx={buildAgeSx(row?.EDAD)}>
          $ {StringToMoney(value)}
        </Box>
      ),
    },
    { id: "CUOTAS", label: "Cuotas" },
    { id: "CUOTASCAN", label: "Canceladas" },
    { id: "CUOTASMORA", label: "En Mora" },
    { id: "MIN_VENC", label: "Vencido" },
    { id: "DIAS", label: "Días" },
    {
      id: "EDAD",
      label: "Edad",
      format: (value: any) => {
        const badge = getAgeBadgeStyle(value);
        return (
          <Box sx={buildAgeSx(value)}>
            {readDisplayValue(value)}
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <DynamicTable
        columns={columns}
        rows={props.rows.map((row) => row)}
        showTittle={true}
        tittle={{ tittleText: 'Facturas', iconClass: 'fas fa-file-invoice-dollar' }}
        enableMobileCards
      />
    </Box>
  );
};
