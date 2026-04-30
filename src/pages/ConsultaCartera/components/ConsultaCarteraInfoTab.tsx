import React from "react";
import { Col, Row } from "react-bootstrap";
import { CustomDatePicker } from "@app/components/DatePicker/DatePickerv2";
import { NumericField } from "@app/components/InputFields/NumericField";
import type { ClienteInfo } from "@app/services/ClienteService";
import {
  ClienteEstadoCuenta,
  type FetchFacturasRef,
} from "../../ConsultaClientes/components/EstadoClienteCompleto";
import { EtiquetasClienteGestion } from "./EtiquetasClientesGestion";
import { SelectedClientSummary } from "./SelectedClientSummary";

interface ConsultaCarteraInfoTabProps {
  fechaConsultaFacturas: string;
  onFechaConsultaFacturasChange: (date: string | null) => void;
  intMora: string;
  onIntMoraChange: (value: string) => void;
  selectedCliente: string;
  selectedFactura: string;
  selectedCuenta: string;
  currentUserId: number;
  clienteInfo: ClienteInfo | null;
  selectedClientSummaryProps?: Omit<
    React.ComponentProps<typeof SelectedClientSummary>,
    "clienteInfo"
  >;
  selectedValue: string;
  filtroSaldoCero: boolean;
  tablaFacturasRef: React.Ref<FetchFacturasRef>;
  onSelectFactura?: (row: any) => void;
}

export function ConsultaCarteraInfoTab({
  fechaConsultaFacturas,
  onFechaConsultaFacturasChange,
  intMora,
  onIntMoraChange,
  selectedCliente,
  selectedFactura,
  selectedCuenta,
  currentUserId,
  clienteInfo,
  selectedClientSummaryProps,
  selectedValue,
  filtroSaldoCero,
  tablaFacturasRef,
  onSelectFactura,
}: ConsultaCarteraInfoTabProps) {
  return (
    <>
      <Row className="mb-3">
        <Col xs={12} md={3}>
          <CustomDatePicker
            label="Seleccione la fecha"
            selectedDate={fechaConsultaFacturas}
            onDateChange={onFechaConsultaFacturasChange}
          />
        </Col>
        <Col xs={12} md={3}>
          <NumericField value={intMora} onChange={onIntMoraChange} />
        </Col>
        <Col xs={12} md={6}>
          <EtiquetasClienteGestion
            cliente={selectedCliente}
            factura={selectedFactura}
            cuenta={selectedCuenta}
            idUser={currentUserId}
          />
        </Col>
      </Row>

      {clienteInfo && selectedClientSummaryProps && (
        <SelectedClientSummary
          clienteInfo={clienteInfo}
          {...selectedClientSummaryProps}
        />
      )}

      <ClienteEstadoCuenta
        cliente={selectedValue}
        fecha={fechaConsultaFacturas}
        intmora={intMora}
        saldoCero={filtroSaldoCero}
        ref={tablaFacturasRef}
        onSelectFactura={onSelectFactura}
      />
    </>
  );
}
