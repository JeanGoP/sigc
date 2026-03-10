import React, { useState } from "react";
import { Card, Row, Col, Form } from "react-bootstrap";

// Tus componentes
import BuscadorCuentas from "@app/components/BuscadorGeneral/BuscadorCuentas";
import BuscadorEtiquetasCliente from "@app/components/BuscadorGeneral/BuscadorEtiquetasCLiente";
import BuscadorTiposEvento from "@app/components/BuscadorGeneral/BuscadorTiposEvento";
import { CustomDatePicker } from "@app/components/DatePicker/DatePickerv2";
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

const opciones: SelectOption[] = [
  { label: "Por vencer", value: "PV" },
  { label: "30", value: "30" },
  { label: "60", value: "60" },
  { label: "90", value: "90" },
  { label: "+90", value: "+90" },
];

const SIN_GESTION_DIAS_OPTIONS = [
  { value: 0, label: "⚪ Todos", color: null },
  { value: 1, label: "🔵 Sin gestión", color: "#0a95b9" },
  { value: 2, label: "🟢 Gestionado hoy", color: "#1d9540" },
  { value: 3, label: "🟡 1 a 5 días", color: "#ffbf06" },
  { value: 4, label: "🔴 Más de 5 días", color: "#e24744" },
] as const;

const normalizeEdadMora = (raw?: string | null): string => {
  const trimmed = (raw ?? "").trim();
  return trimmed.length > 0 ? trimmed : "todos";
};

const parseEdadMora = (raw?: string | null): SelectOption[] => {
  const normalized = normalizeEdadMora(raw);
  if (normalized === "todos") return [];
  const values = normalized
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
  return opciones.filter((opt) => values.includes(opt.value));
};

const serializeEdadMora = (items: SelectOption[]): string => {
  if (!items || items.length === 0) return "todos";
  return items.map((opt) => opt.value).join(";");
};

export const FiltrosCarteras: React.FC<FiltrosCarterasProps> = ({
  onApply,
}: FiltrosCarterasProps) => {
  // ------------------------------------------------------
  // VALOR INICIAL DESDE LOCAL STORAGE
  // ------------------------------------------------------
  const storedRaw =
    loadFiltrosCarteras() as Partial<FiltrosFacturasCarteraModel> | null;
  const initialFiltros = new FiltrosFacturasCarteraModel(
    storedRaw ?? undefined,
  );

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
    console.log("Hay cambios?", hasChanges);
    saveFiltrosCarteras(filtros);
    markAsSaved(); // Marca como guardado
    // Llama al callback del padre para notificar que se aplicaron filtros
    onApply();
  };

  const limpiarFiltros = () => {
    const clean = new FiltrosFacturasCarteraModel();
    clean.filtroEdadMora = "todos";
    setFiltros(clean);
    setSelected([]);
    clearFiltrosCarteras();
  };

  const handleChangeSinGestionDias = (value: string | number) => {
    const numericValue = Number(value);
    update("sinGestionDias", Number.isFinite(numericValue) ? numericValue : 0);
  };

  const handleChangeFiltroTipoEvento = (value: string | number | null) => {
    console.log("Tipo Evento cambiado:", value);
    update("tipoEvento", value);
  };

  const handleChangeFiltroCuenta = (value: string | number | null) => {
    console.log("Cuenta cambiada:", value);
    update("cuenta", value);
  };

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
                  onChange={(e) =>
                    update("checkIncluirSaldosCero", e.target.checked)
                  }
                />
              </div>

              <div className="col mb-2 mt-2">
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
              <div className="col mb-2 mt-2">
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
              <Col md={6}>
                <BuscadorTiposEvento
                  label="Filtro por Tipo de Evento"
                  value={filtros.tipoEvento ?? undefined}
                  placeholder="Sin filtro"
                  onSelect={(v) => handleChangeFiltroTipoEvento(v)}
                />
              </Col>

              <Col md={6}>
                <BuscadorEtiquetasCliente
                  label="Filtro por Etiquetas"
                  value={filtros.etiqueta ?? undefined}
                  placeholder="Sin filtro"
                  onSelect={(v) => update("etiqueta", v)}
                />
              </Col>

              <Col md={6}>
                <SingleSelect
                  options={SIN_GESTION_DIAS_OPTIONS}
                  selectedValue={filtros.sinGestionDias}
                  onChange={handleChangeSinGestionDias}
                  label="Días sin gestión"
                />
              </Col>

              <Col md={6}>
                <CustomDatePicker
                  selectedDate={filtros.filtroPorVencimiento ?? ""}
                  label="Fecha de Vencimiento"
                  onDateChange={(date) => update("filtroPorVencimiento", date)}
                />
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
              options={opciones}
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
