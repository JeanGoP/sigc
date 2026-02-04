import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { TablaFacturas } from "./TablaFacturas";
import EstadoClienteTable from "./prueba_tablaSaldos";
import { RecibosCajaTable } from "./TablaRecibosCaja";
import { FacturaListado } from "@app/models/facturaConsultaclienteModel";
import { useRecibosCajaService } from "@app/services/GestionCartera/EstadoClienteCompletoService.ts/GetRecibosCajaListService";
import { useFacturasService } from "@app/services/GestionCartera/EstadoClienteCompletoService.ts/EstadoClienteCompletoService";

const normalizeValue = (value: string) => String(value ?? "").trim();

interface Props {
  cliente: string;
  fecha: string;
  intmora: string;
  // numCuotas: number;
  onSelectFactura?: (row: any) => void;
}

export interface FetchFacturasRef {
  fetchFacturas: (options?: { force?: boolean }) => void;
}

export const ClienteEstadoCuenta = forwardRef<FetchFacturasRef, Props>(
  ({ cliente, fecha, intmora, onSelectFactura }: Props, ref: any) => {
    const [rowsFacturas, setRowsFacturas] = useState<FacturaListado[]>([]);
    const [clienteCuotasRows, setClienteCuotasRows] = useState<any[]>([]);
    const [TableRowsRecibosCaja, setTableRowsRecibosCaja] = useState<any[]>([]);

    const { listarFacturas } = useFacturasService();
    const lastSuccessKeyRef = useRef<string | null>(null);
    const inFlightKeyRef = useRef<string | null>(null);
    const requestIdRef = useRef(0);

    const {
      ObtenerRecibosCajaPorFactura,
      loading: loadingRecibos,
      error: errorRecibos,
    } = useRecibosCajaService();
    const ReciboCajaHandler = useCallback(async (factura: string) => {
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
    }, [ObtenerRecibosCajaPorFactura, fecha, cliente]);

    const clienteKey = useMemo(() => normalizeValue(cliente), [cliente]);
    const fechaKey = useMemo(() => normalizeValue(fecha), [fecha]);
    const requestKey = useMemo(
      () => `${clienteKey}|${fechaKey}`,
      [clienteKey, fechaKey]
    );

    useEffect(() => {
      if (!clienteKey) {
        // Invalida cualquier respuesta en vuelo
        requestIdRef.current += 1;
        if (rowsFacturas.length) setRowsFacturas([]);
        if (clienteCuotasRows.length) setClienteCuotasRows([]);
        if (TableRowsRecibosCaja.length) setTableRowsRecibosCaja([]);
        lastSuccessKeyRef.current = null;
        inFlightKeyRef.current = null;
      }
    }, [clienteKey, rowsFacturas.length, clienteCuotasRows.length, TableRowsRecibosCaja.length]);

    // Fetch de facturas con dedupe + stale-guard
    const fetchFacturas = useCallback(async (options?: { force?: boolean }) => {
      if (!clienteKey) return;

      const key = requestKey;

      if (!options?.force) {
        if (lastSuccessKeyRef.current === key) return;
        if (inFlightKeyRef.current === key) return;
      }

      const requestId = ++requestIdRef.current;
      inFlightKeyRef.current = key;
      try {
        if (clienteCuotasRows.length) setClienteCuotasRows([]);
        if (TableRowsRecibosCaja.length) setTableRowsRecibosCaja([]);

        const res = await listarFacturas({
          fecha: fechaKey,
          cliente: clienteKey,
        });

        if (requestId !== requestIdRef.current) return;

        if (res?.success) {
          setRowsFacturas(res.data ?? []);
          lastSuccessKeyRef.current = key;
        } else {
          setRowsFacturas([]);
          console.error("Error al listar facturas:", res?.message);
          lastSuccessKeyRef.current = null;
        }
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        console.error("Error al obtener las facturas", error);
        setRowsFacturas([]);
        lastSuccessKeyRef.current = null;
      } finally {
        if (requestId === requestIdRef.current && inFlightKeyRef.current === key) {
          inFlightKeyRef.current = null;
        }
      }
    }, [
      clienteKey,
      requestKey,
      listarFacturas,
      fechaKey,
      clienteCuotasRows.length,
      TableRowsRecibosCaja.length,
    ]);

    useImperativeHandle(ref, () => ({
      fetchFacturas,
    }));

    return (
      <div >
        <TablaFacturas
          rows={rowsFacturas}
          cliente={cliente}
          fecha={fecha}
          intmora={intmora}
          setCuotas={setClienteCuotasRows}
          setFacturaFather={ReciboCajaHandler}
          onSelectFactura={onSelectFactura}
        />
        <EstadoClienteTable rows={clienteCuotasRows} numCuotas={clienteCuotasRows.length} />

        {/* 👇 puedes mostrar loading o error */}
        {loadingRecibos && <p>Cargando recibos...</p>}
        {errorRecibos && <p style={{ color: "red" }}>{errorRecibos}</p>}

        <RecibosCajaTable rows={TableRowsRecibosCaja} />
      </div>
    );
  }
);
