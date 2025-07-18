import React, { useState,useImperativeHandle, forwardRef, useEffect, useRef } from "react";
import { TablaFacturas } from "./TablaFacturas";
import EstadoClienteTable from "./prueba_tablaSaldos";
import { RecibosCajaTable } from "./TablaRecibosCaja";
import { TableColumn } from "./tablaReutilizables";
import { FacturaListado } from "@app/models/facturaConsultaclienteModel";
import { ObtenerRecibosCajaPorFactura } from "@app/services/GetRecibosCajaListService";
import { handleApiResponse } from "@app/utils/handleApiResponse";

interface Props {
  cliente: string;
  fecha: string;
  intmora: string;
}

export interface FetchFacturasRef {
    fetchFacturas: () => void;
  }

export const ClienteEstadoCuenta = forwardRef<FetchFacturasRef, Props>(({
  cliente,
  fecha,
  intmora,
}: Props, ref: any) => {

    const [rowsFacturas, setRowsFacturas] = useState<FacturaListado[]>([]);
    const [clienteCuotasRows, setClienteCuotasRows] = useState<any[]>([]);
    const [TableRowsRecibosCaja, setTableRowsRecibosCaja] = useState<any[]>([]);
    const tablaFacturasRef = useRef<FetchFacturasRef | null>(null);

    const ReciboCajaHandler = async (factura: string) => {
        try {
          const recibosCaja = await ObtenerRecibosCajaPorFactura(fecha,cliente,factura);
          setTableRowsRecibosCaja(recibosCaja.data || []);
        } catch (error) {
          console.error("Error al obtener los recibos de caja:", error);
        }
      }

      const fetchFacturas = async () => {
        try {
          const queryParams = new URLSearchParams({
            fecha: fecha.toString(),
            cliente: cliente.toString(),
          });
          // console.log("ESTE ES EL CLIENTE QUE SE ESTA MANDANDO EN EL URL DE LA API",cliente);
    
          if (clienteCuotasRows.length > 0) {
            setClienteCuotasRows([]);
          }
    
          const token = localStorage.getItem('token');
          const response = await fetch(
            `https://localhost:7013/api/FacturasListByClient?${queryParams.toString()}`,
            {
              method: "GET",
              headers: {
                Accept: "*/*",
                'Authorization': `Bearer ${token}`
              },
            }
          );
    
          if (!response.ok) {
            throw new Error(`Error en la respuesta: ${response.statusText}`);
          }
  
          const data = handleApiResponse<FacturaListado>(response);
          const res = await data;
          setRowsFacturas(res.data);
        } catch (error) {
          console.error("Error al obtener las facturas", error);
        }
      };

        useImperativeHandle(ref, () => ({
            fetchFacturas,
            }));
    

  return (
    <div style={{ padding: 20 }}>
      <TablaFacturas
        rows={rowsFacturas}
        cliente={cliente}
        fecha={fecha}
        intmora={intmora}
        setCuotas={setClienteCuotasRows}
        setFacturaFather={ReciboCajaHandler}
      />
      <EstadoClienteTable rows={clienteCuotasRows} />
      <RecibosCajaTable rows={TableRowsRecibosCaja} />
    </div>
  );
});
