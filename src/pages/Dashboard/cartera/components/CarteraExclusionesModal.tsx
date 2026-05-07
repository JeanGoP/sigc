import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";
import type { DashboardCarteraCuentaExcluidaDto } from "@app/services/Dashboard/dashboardCarteraExclusionService";

interface CarteraExclusionesModalProps {
  show: boolean;
  onHide: () => void;
  loading: boolean;
  accountOptions: Array<{ label: string; value: string | number }>;
  cuentasExcluidas: DashboardCarteraCuentaExcluidaDto[];
  onAgregarCuenta: (cuenta: string) => Promise<boolean> | boolean;
  onEliminarCuenta: (cuenta: string) => Promise<boolean> | boolean;
}

export function CarteraExclusionesModal({
  show,
  onHide,
  loading,
  accountOptions,
  cuentasExcluidas,
  onAgregarCuenta,
  onEliminarCuenta,
}: CarteraExclusionesModalProps) {
  const [selectedCuenta, setSelectedCuenta] = useState<string>("");

  useEffect(() => {
    if (!show) {
      return;
    }

    if (!selectedCuenta && accountOptions.length > 0) {
      setSelectedCuenta(String(accountOptions[0].value));
    }
  }, [show, selectedCuenta, accountOptions]);

  const excludedSet = new Set(
    cuentasExcluidas.map((item) => String(item.cuenta).trim().toLowerCase()),
  );

  const selectableOptions = accountOptions.filter(
    (option) => !excludedSet.has(String(option.value).trim().toLowerCase()),
  );

  const canAdd =
    selectableOptions.length > 0 &&
    selectedCuenta.trim().length > 0 &&
    !excludedSet.has(selectedCuenta.trim().toLowerCase());

  const handleAgregar = async () => {
    if (!canAdd || loading) {
      return;
    }

    const ok = await onAgregarCuenta(selectedCuenta);
    if (!ok) {
      return;
    }

    const next = selectableOptions.find(
      (option) =>
        String(option.value).trim().toLowerCase() !==
        selectedCuenta.trim().toLowerCase(),
    );
    setSelectedCuenta(next ? String(next.value) : "");
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header {...({ closeButton: !loading } as any)}>
        <Modal.Title>Configurar cuentas excluidas</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          {selectableOptions.length > 0 ? (
            <SingleSelect
              label="Cuenta"
              options={selectableOptions}
              selectedValue={
                selectedCuenta || String(selectableOptions[0]?.value ?? "")
              }
              onChange={(value) => setSelectedCuenta(String(value))}
            />
          ) : (
            <div className="small text-muted">
              No hay cuentas disponibles para excluir.
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end mb-3">
          <Button
            variant="primary"
            onClick={() => void handleAgregar()}
            disabled={loading || !canAdd}
          >
            {loading ? "Guardando..." : "Agregar"}
          </Button>
        </div>

        <hr />

        <div className="small text-muted mb-2">Cuentas excluidas actuales</div>
        {cuentasExcluidas.length === 0 ? (
          <div className="small text-muted">Sin cuentas excluidas.</div>
        ) : (
          <div className="d-flex flex-wrap" style={{ gap: 6 }}>
            {cuentasExcluidas.map((item) => (
              <Button
                key={item.cuenta}
                variant="outline-secondary"
                size="sm"
                disabled={loading}
                onClick={() => void onEliminarCuenta(item.cuenta)}
                title="Quitar exclusión"
              >
                {item.cuenta} x
              </Button>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
