import React from "react";
import { Card, Row, Col, Form } from "react-bootstrap";

// Tus componentes
import BuscadorCuentas from "@app/components/BuscadorGeneral/BuscadorCuentas";
import BuscadorEtiquetasCliente from "@app/components/BuscadorGeneral/BuscadorEtiquetasCLiente";
import BuscadorTiposEvento from "@app/components/BuscadorGeneral/BuscadorTiposEvento";
import { CustomDatePicker } from "@app/components/DatePicker/DatePickerv2";
import { NumericFilter } from "@app/components/NumericFieldForm/NumericFieldForm";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";

// Helpers
import {
  saveFiltrosCarteras,
  loadFiltrosCarteras,
  clearFiltrosCarteras,
} from "@app/utils/localStorageHandler";
import { FiltrosFacturasCarteraModel } from "@app/models/otros/FiltrosFacturasCarteraModel";

// Hook
import { useUnsavedChanges } from "@app/hooks/useUnsavedChanges";

export interface FiltrosCarterasProps {
  state: boolean;
  onApply: () => void;
}

export type FiltrosCarterasRef = {
  aplicarFiltrosDesdePadre(): void;
  limpiarFiltrosDesdePadre(): void;
  obtenerFiltros(): FiltrosFacturasCarteraModel;
  tieneCambiosSinGuardar(): boolean;
};


export const FiltrosCarteras: React.FC<FiltrosCarterasProps> = ({ onApply }: FiltrosCarterasProps) => {
  // ------------------------------------------------------
  // VALOR INICIAL DESDE LOCAL STORAGE
  // ------------------------------------------------------
  const storedRaw = loadFiltrosCarteras() as Partial<FiltrosFacturasCarteraModel> | null;
  const initialFiltros = new FiltrosFacturasCarteraModel(storedRaw ?? undefined);

  // Hook que detecta cambios y bloquea cierre sin guardar
  const {
    value: filtros,
    setValue: setFiltros,
    hasChanges,
    markAsSaved,
  } = useUnsavedChanges(initialFiltros);

  // Handlers simples y optimizados
  const update = (key: string, val: any) => {
    setFiltros({ ...filtros, [key]: val });
  };

  const aplicarFiltros = () => {
    console.log("Hay cambios?", hasChanges);
    saveFiltrosCarteras(filtros);
    markAsSaved(); // Marca como guardado
    // Llama al callback del padre para notificar que se aplicaron filtros
    onApply();
  };

  const limpiarFiltros = () => {
    setFiltros(new FiltrosFacturasCarteraModel());
    clearFiltrosCarteras();
  };

  const handleChangeSindGestionDias = (value: number | null) => {
    update("sinGestionDias", value);
    // const value = e.target.value;
    // const numericValue = value === "" ? null : parseInt(value, 10);
    // update("sinGestionDias", numericValue);
  }

  const handleChangeFiltroTipoEvento = (value: string | number | null) => {
    console.log("Tipo Evento cambiado:", value);
    update("tipoEvento", value);
  }

  const handleChangeFiltroCuenta = (value: string | number | null) => {
    console.log("Cuenta cambiada:", value);
    update("cuenta", value);
  }

  return (
    <div>
      <Card>
        <Card.Body>
          <Form>
            <div className="row">
              <div className="col mb-2 mt-2">
                <Form.Label>Incluir Carteras con saldo cero</Form.Label>
                <Form.Check
                  type="switch"
                  id="switch-incluir-saldos-cero"
                  checked={filtros.checkIncluirSaldosCero}
                  onChange={(e) => update("checkIncluirSaldosCero", e.target.checked)}
                />
              </div>

              <div className="col mb-2 mt-2">
                <Form.Label>Solo carteras asignadas</Form.Label>
                <Form.Check
                  type="switch"
                  id="switch-solo-asignadas"
                  checked={filtros.checkSoloAsignadas}
                  onChange={(e) => update("checkSoloAsignadas", e.target.checked)}
                />
              </div>
            </div>

            <BuscadorCuentas
              opcion="CU"
              op="CLIENTE"
              value={filtros.cuenta ?? undefined}
              placeholder="Buscar cuenta..."
              label="Cuenta"
              onChange={(v) => handleChangeFiltroCuenta(v)}
              // onSelect={(v) => handleChangeFiltroCuenta(v)}
            />

            <BuscadorTiposEvento
              label="Filtro por Tipo de Evento"
              value={filtros.tipoEvento ?? undefined}
              placeholder="Sin filtro"
              onSelect={(v) => handleChangeFiltroTipoEvento(v)}
            />

            <BuscadorEtiquetasCliente
              label="Filtro por Etiquetas"
              value={filtros.etiqueta ?? undefined}
              placeholder="Sin filtro"
              onSelect={(v) => update("etiqueta", v)}
            />

            <NumericFilter
              tittle="Dias sin gestion"
              value={filtros.sinGestionDias ?? ""}
              onChange={(v) =>handleChangeSindGestionDias(v)}
            />

            <Row>
              <div className="col">
                <SingleSelect
                  options={[
                    { label: "Todos", value: "todos" },
                    { label: "Por vencer", value: "PV" },
                    { label: "30", value: "30" },
                    { label: "60", value: "60" },
                    { label: "90", value: "90" },
                    { label: "+90", value: "+90" },
                  ]}
                  selectedValue={filtros.filtroEdadMora}
                  onChange={(v) => update("filtroEdadMora", v)}
                  label="Filtrar por edad"
                />
              </div>

              <Col md={6}>
                <CustomDatePicker
                  selectedDate={filtros.filtroPorVencimiento ?? ""}
                  label="Fecha de Vencimiento"
                  onDateChange={(date) => update("filtroPorVencimiento", date)}
                />
              </Col>
            </Row>

            <div className="row">
              <div className="col">

              </div>
              <div className="col">
              <button
                className="btn btn-primary"
                type="button"
                style={{ margin: "auto" }}
                onClick={aplicarFiltros}
              >
                Aplicar Filtros
              </button>
              <button
                className="btn btn-secondary ms-2"
                type="button"
                style={{ marginLeft: "10px" }}
                onClick={limpiarFiltros}
              >
                Limpiar Filtros
              </button>
                
              </div>

            </div>
              {hasChanges && (
                <span className="text-danger ms-2">
                  Tienes cambios sin guardar
                </span>
              )}
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};
