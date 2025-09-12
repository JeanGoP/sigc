import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { TablaFacturas } from "./TablaFacturas";
import EstadoClienteTable from "./prueba_tablaSaldos";
import { RecibosCajaTable } from "./TablaRecibosCaja";
import { FacturaListado } from "@app/models/facturaConsultaclienteModel";
import { handleApiResponse } from "@app/utils/handleApiResponse";
import { useRecibosCajaService } from "@app/services/GestionCartera/EstadoClienteCompletoService.ts/GetRecibosCajaListService";
import { useFacturasService } from "@app/services/GestionCartera/EstadoClienteCompletoService.ts/EstadoClienteCompletoService";

const API_URL = import.meta.env.VITE_API_URL;

interface Props {
  cliente: string;
  fecha: string;
  intmora: string;
}

export interface FetchFacturasRef {
  fetchFacturas: () => void;
}

export const ClienteEstadoCuenta = forwardRef<FetchFacturasRef, Props>(
  ({ cliente, fecha, intmora }: Props, ref: any) => {
    const [rowsFacturas, setRowsFacturas] = useState<FacturaListado[]>([]);
    const [clienteCuotasRows, setClienteCuotasRows] = useState<any[]>([]);
    const [TableRowsRecibosCaja, setTableRowsRecibosCaja] = useState<any[]>([]);

    const tablaFacturasRef = useRef<FetchFacturasRef | null>(null);
    const { listarFacturas } = useFacturasService();

    const {
      ObtenerRecibosCajaPorFactura,
      loading: loadingRecibos,
      error: errorRecibos,
    } = useRecibosCajaService();
    const ReciboCajaHandler = async (factura: string) => {
      try {
        const recibosCaja = await ObtenerRecibosCajaPorFactura(
          fecha,
          cliente,
          factura
        );

        if (recibosCaja?.success) {
          setTableRowsRecibosCaja(recibosCaja.data ?? []);
        } else {
          console.error("Error API:", recibosCaja?.message);
        }
      } catch (error) {
        console.error("Error al obtener los recibos de caja:", error);
      }
    };

    // Fetch de facturas (queda igual por ahora)
    const fetchFacturas = async () => {
      try {
        if (clienteCuotasRows.length > 0) {
          setClienteCuotasRows([]);
        }

        const res = await listarFacturas({
          fecha: fecha.toString(),
          cliente: cliente.toString(),
        });

        if (res?.success) {
          setRowsFacturas(res.data ?? []);
        } else {
          setRowsFacturas([]);
          console.error("Error al listar facturas:", res?.message);
        }
      } catch (error) {
        console.error("Error al obtener las facturas", error);
        setRowsFacturas([]);
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

        {/* 👇 puedes mostrar loading o error */}
        {loadingRecibos && <p>Cargando recibos...</p>}
        {errorRecibos && <p style={{ color: "red" }}>{errorRecibos}</p>}

        <RecibosCajaTable rows={TableRowsRecibosCaja} />
      </div>
    );
  }
);
