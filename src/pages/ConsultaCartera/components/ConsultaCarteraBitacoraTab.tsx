import React from "react";
import { TablaEventosPorClave } from "./TablaEventosPorClave/TablaEventosPorClave";

interface ConsultaCarteraBitacoraTabProps {
  hasFullSelection: boolean;
  selectedCliente: string;
  selectedFactura: string;
  selectedCuenta: string;
}

export function ConsultaCarteraBitacoraTab({
  hasFullSelection,
  selectedCliente,
  selectedFactura,
  selectedCuenta,
}: ConsultaCarteraBitacoraTabProps) {
  if (!hasFullSelection) {
    return (
      <div className="text-center p-4">
        <p>Seleccione cliente, factura y cuenta para ver su bitácora</p>
      </div>
    );
  }

  return (
    <TablaEventosPorClave
      cliente={selectedCliente}
      factura={selectedFactura}
      cuenta={selectedCuenta}
    />
  );
}
