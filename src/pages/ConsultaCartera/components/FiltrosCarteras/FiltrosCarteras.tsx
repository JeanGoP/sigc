import React, { useState } from "react";
import { Card, Row, Col, Form } from "react-bootstrap";

// Tus componentes
import BuscadorCuentas from "@app/components/BuscadorGeneral/BuscadorCuentas";
import BuscadorEtiquetasCliente from "@app/components/BuscadorGeneral/BuscadorEtiquetasCLiente";
import BuscadorTiposEvento from "@app/components/BuscadorGeneral/BuscadorTiposEvento";
import { CustomDatePicker } from "@app/components/DatePicker/DatePickerv2";
import { SingleSelect } from "@app/components/singleSelect/singleSelect";

import { FiltrosFacturasCarteraModel } from "@app/models/otros/FiltrosFacturasCarteraModel";
import {
  clearConsultaCarteraFilters,
  loadConsultaCarteraFilters,
  saveConsultaCarteraFilters,
} from "../../domain/filterStorage";
import {
  EDAD_MORA_OPTIONS,
  normalizeEdadMora,
  parseEdadMora,
  serializeEdadMora,
  SIN_GESTION_DIAS_OPTIONS,
} from "../../domain/filterOptions";

// Hook
import { useUnsavedChanges } from "@app/hooks/useUnsavedChanges";
import MultiSelectSimple, {
  SelectOption,
} from "@app/components/MultiSelectCheckBox/MultiselectNuevo";

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

export const FiltrosCarteras: React.FC<FiltrosCarterasProps> = ({
  onApply,
}: FiltrosCarterasProps) => {
  // ------------------------------------------------------
  // VALOR INICIAL DESDE LOCAL STORAGE
  // ------------------------------------------------------
  const initialFiltros = loadConsultaCarteraFilters();

  initialFiltros.filtroEdadMora = normalizeEdadMora(
    initialFiltros.filtroEdadMora,
  );

  const [selected, setSelected] = useState<SelectOption[]>(() =>
    parseEdadMora(initialFiltros.filtroEdadMora),
  );

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
    saveConsultaCarteraFilters(filtros);
    markAsSaved(); // Marca como guardado
    // Llama al callback del padre para notificar que se aplicaron filtros
    onApply();
  };

  const limpiarFiltros = () => {
    const clean = new FiltrosFacturasCarteraModel();
    clean.filtroEdadMora = "todos";
    setFiltros(clean);
    setSelected([]);
    clearConsultaCarteraFilters();
  };

  const handleChangeSinGestionDias = (value: string | number) => {
    const numericValue = Number(value);
    update("sinGestionDias", Number.isFinite(numericValue) ? numericValue : 0);
  };

  const handleChangeFiltroTipoEvento = (value: string | number | null) => {
    update("tipoEvento", value);
  };

  const handleChangeFiltroCuenta = (value: string | number | null) => {
    update("cuenta", value);
  };

  const handleChangeValorCuota = (
    key: "minValorCuota" | "maxValorCuota",
    value: string
  ) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      update(key, null);
      return;
    }

    const numericValue = Number(trimmedValue);
    update(key, Number.isFinite(numericValue) && numericValue >= 0 ? Math.trunc(numericValue) : null);
  };

  return (
    <div>
      <Card>
        <Card.Body>
          <Form>
            <div className="row">
              <div className="col-12 col-md-4 mb-2 mt-2">
                <Form.Label>Incluir Carteras con saldo cero</Form.Label>
                <Form.Check
                  type="switch"
                  id="switch-incluir-saldos-cero"
                  checked={filtros.checkIncluirSaldosCero}
                  onChange={(e) =>
                    update("checkIncluirSaldosCero", e.target.checked)
                  }
                />
              </div>

              <div className="col-12 col-md-4 mb-2 mt-2">
                <Form.Label>Solo carteras asignadas</Form.Label>
                <Form.Check
                  type="switch"
                  id="switch-solo-asignadas"
                  checked={filtros.checkSoloAsignadas}
                  onChange={(e) =>
                    update("checkSoloAsignadas", e.target.checked)
                  }
                />
              </div>
              <div className="col-12 col-md-4 mb-2 mt-2">
                <Form.Label>Mostrar ya gestionados</Form.Label>
                <Form.Check
                  type="switch"
                  id="switch-solo-sin-eventos-vigentes"
                  checked={filtros.checkSoloEventosPendientes}
                  onChange={(e) =>
                    update("checkSoloEventosPendientes", e.target.checked)
                  }
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

            <Row>
              <Col xs={12} sm={6}>
                <BuscadorTiposEvento
                  label="Filtro por Tipo de Evento"
                  value={filtros.tipoEvento ?? undefined}
                  placeholder="Sin filtro"
                  onSelect={(v) => handleChangeFiltroTipoEvento(v)}
                />
              </Col>

              <Col xs={12} sm={6}>
                <BuscadorEtiquetasCliente
                  label="Filtro por Etiquetas"
                  value={filtros.etiqueta ?? undefined}
                  placeholder="Sin filtro"
                  onSelect={(v) => update("etiqueta", v)}
                />
              </Col>

              <Col xs={12} sm={6}>
                <SingleSelect
                  options={SIN_GESTION_DIAS_OPTIONS}
                  selectedValue={filtros.sinGestionDias}
                  onChange={handleChangeSinGestionDias}
                  label="D�as sin gesti�n"
                />
              </Col>

              <Col xs={12} sm={6}>
                <CustomDatePicker
                  selectedDate={filtros.filtroPorVencimiento ?? ""}
                  label="Fecha de Vencimiento"
                  onDateChange={(date) => update("filtroPorVencimiento", date)}
                />
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label>Valor cuota minimo</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    step={1}
                    value={filtros.minValorCuota ?? ""}
                    placeholder="Sin minimo"
                    onChange={(e) => handleChangeValorCuota("minValorCuota", e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label>Valor cuota maximo</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    step={1}
                    value={filtros.maxValorCuota ?? ""}
                    placeholder="Sin maximo"
                    onChange={(e) => handleChangeValorCuota("maxValorCuota", e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              {/* <div className="col">
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
              </div> */}
            </Row>
            <Form.Label>Edad de mora</Form.Label>
            <MultiSelectSimple
              options={EDAD_MORA_OPTIONS}
              value={selected}
              onChange={(items) => {
                const nextSelected = [...items];
                setSelected(nextSelected);
                update("filtroEdadMora", serializeEdadMora(nextSelected));
              }}
            />

            <div className="row">
              <div className="col"></div>
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
                  className="btn btn-secondary"
                  type="button"
                  style={{ marginLeft: "10px" }}
                  onClick={limpiarFiltros}
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
            {hasChanges && (
              <span className="text-danger" style={{ marginLeft: 8 }}>
                Tienes cambios sin guardar
              </span>
            )}
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};
