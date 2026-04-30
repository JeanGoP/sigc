import type { CarteraAsignacionActual } from "@app/services/AsignacionCarteras/asignacionCarterasService";
import {
  buildAllSelectedKeys,
  buildCarteraRowKey,
  buildDefaultAsignacionFilters,
  buildGuardarAsignacionPayload,
  buildListarAsignacionesParams,
  buildListarHistorialParams,
  buildReasignacionMasivaPayload,
  pruneSelectedKeys,
  toggleSelectedKey,
  toggleTramoSelection,
  validateNuevaAsignacion,
  validateReasignacion,
  validateReasignacionMasiva,
} from "../domain/helpers";

function createAsignacion(
  overrides: Partial<CarteraAsignacionActual> = {},
): CarteraAsignacionActual {
  return {
    id: 1,
    cuenta: "1105",
    tramoCodigo: "PV",
    tramoNombre: "Por vencer",
    tramoOrden: 1,
    asesorUserId: 9,
    asesorNombre: "Ana",
    fechaAsignacion: "2026-04-20T10:00:00",
    asignadoPorUserId: 8,
    asignadoPorNombre: "Lider",
    updatedAt: "2026-04-21T11:00:00",
    ...overrides,
  };
}

describe("asignacion carteras helpers", () => {
  it("crea filtros iniciales con rango de 30 dias", () => {
    expect(
      buildDefaultAsignacionFilters(new Date("2026-04-28T08:00:00Z")),
    ).toEqual({
      filtroCuenta: "",
      filtroTramo: "",
      filtroAsesorId: "",
      fechaInicio: "2026-03-29",
      fechaFin: "2026-04-28",
    });
  });

  it("construye params de consulta e historial", () => {
    const filters = {
      filtroCuenta: " 1105 ",
      filtroTramo: "30",
      filtroAsesorId: "15",
      fechaInicio: "2026-04-01",
      fechaFin: "2026-04-28",
    };

    expect(buildListarAsignacionesParams(filters)).toEqual({
      cuenta: "1105",
      tramoCodigo: "30",
      asesorUserId: 15,
      soloTramosActivos: true,
    });

    expect(buildListarHistorialParams(filters)).toEqual({
      cuenta: "1105",
      tramoCodigo: "30",
      asesorUserId: 15,
      fechaInicio: "2026-04-01",
      fechaFin: "2026-04-28",
    });
  });

  it("maneja seleccion de filas", () => {
    const row = createAsignacion();
    const key = buildCarteraRowKey(row);

    expect(toggleSelectedKey([], row)).toEqual([key]);
    expect(toggleSelectedKey([key], row)).toEqual([]);
    expect(buildAllSelectedKeys([row])).toEqual([key]);
    expect(pruneSelectedKeys([row], [key, "otra"])).toEqual([key]);
  });

  it("maneja seleccion de tramos", () => {
    expect(toggleTramoSelection([], "PV")).toEqual(["PV"]);
    expect(toggleTramoSelection(["PV"], "PV")).toEqual([]);
  });

  it("valida y construye payload de nueva asignacion", () => {
    expect(
      validateNuevaAsignacion(true, {
        cuenta: "",
        tramos: [],
        asesorId: "",
        motivo: "",
      }),
    ).toBe("La cuenta es obligatoria");

    expect(
      buildGuardarAsignacionPayload({
        cuenta: " 1105 ",
        tramos: ["PV", "30"],
        asesorId: "8",
        motivo: " mover ",
      }),
    ).toEqual({
      cuenta: "1105",
      tramos: ["PV", "30"],
      asesorNuevoUserId: 8,
      motivo: "mover",
    });
  });

  it("valida reasignacion simple y masiva", () => {
    expect(validateReasignacion(false, "1")).toBe(
      "No tienes permisos para reasignar carteras",
    );
    expect(validateReasignacion(true, "")).toBe("Debe seleccionar un asesor");
    expect(validateReasignacion(true, "5")).toBeNull();

    expect(validateReasignacionMasiva(true, "", 1)).toBe(
      "Debe seleccionar un asesor",
    );
    expect(validateReasignacionMasiva(true, "5", 0)).toBe(
      "No hay filas seleccionadas",
    );
    expect(validateReasignacionMasiva(true, "5", 2)).toBeNull();
  });

  it("construye payload masivo de reasignacion", () => {
    expect(
      buildReasignacionMasivaPayload(
        [createAsignacion(), createAsignacion({ cuenta: "1305", tramoCodigo: "30" })],
        {
          asesorId: "22",
          motivo: " reparto ",
        },
      ),
    ).toEqual([
      {
        cuenta: "1105",
        tramoCodigo: "PV",
        asesorNuevoUserId: 22,
        motivo: "reparto",
      },
      {
        cuenta: "1305",
        tramoCodigo: "30",
        asesorNuevoUserId: 22,
        motivo: "reparto",
      },
    ]);
  });
});
