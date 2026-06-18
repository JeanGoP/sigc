import React from "react";
import {
  TimelineSeguimientos,
  type Seguimiento,
  type NuevoSeguimientoResult,
} from "@app/modules/maestros/tipos-eventos/TimelineSeguimientos";

interface ConsultaCarteraSeguimientoTabProps {
  seguimientos: Seguimiento[];
  onNuevoSeguimiento: (
    seguimiento: Omit<Seguimiento, "id" | "usuario" | "fecha" | "hora">
  ) => Promise<NuevoSeguimientoResult>;
  onBuscar?: () => Promise<unknown> | void;
  isSeguimientoDraftOpen: boolean;
  onSeguimientoDraftOpenChange: (open: boolean) => void;
  seguimientoDraftStorageKey?: string;
  canSaveSeguimiento: boolean;
  saveSeguimientoBlockedReason: string;
  currentUserId: number;
  selectedCliente: string;
  selectedFactura: string;
  selectedCuenta: string;
  montoEventoSugerido?: number;
}

export function ConsultaCarteraSeguimientoTab({
  seguimientos,
  onNuevoSeguimiento,
  onBuscar,
  isSeguimientoDraftOpen,
  onSeguimientoDraftOpenChange,
  seguimientoDraftStorageKey,
  canSaveSeguimiento,
  saveSeguimientoBlockedReason,
  currentUserId,
  selectedCliente,
  selectedFactura,
  selectedCuenta,
  montoEventoSugerido,
}: ConsultaCarteraSeguimientoTabProps) {
  return (
    <TimelineSeguimientos
      seguimientos={seguimientos}
      onNuevoSeguimiento={onNuevoSeguimiento}
      onBuscar={onBuscar}
      nuevoAbiertoControlado={isSeguimientoDraftOpen}
      onNuevoAbiertoChange={onSeguimientoDraftOpenChange}
      draftStorageKey={seguimientoDraftStorageKey}
      ocultarBotonNuevo
      disableGuardarSeguimiento={!canSaveSeguimiento}
      disableGuardarSeguimientoReason={saveSeguimientoBlockedReason}
      contextoEvento={{
        idUsuario: currentUserId,
        cliente: selectedCliente,
        factura: selectedFactura,
        cuenta: selectedCuenta,
      }}
      montoSugeridoEvento={montoEventoSugerido}
    />
  );
}
