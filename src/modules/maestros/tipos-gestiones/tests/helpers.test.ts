import {
  buildGuardarTipoGestionPayload,
  buildTipoGestionFormData,
} from "../domain/helpers";

describe("tipos gestiones helpers", () => {
  it("builds empty form data for a new type", () => {
    expect(buildTipoGestionFormData(null)).toEqual({
      nombre: "",
      descripcion: "",
      estado: true,
    });
  });

  it("builds form data from an existing type", () => {
    expect(
      buildTipoGestionFormData({
        id: 7,
        nombre: "Llamada",
        descripcion: "Contacto telefonico",
        estado: false,
        formaContacto: "CD",
      })
    ).toEqual({
      nombre: "Llamada",
      descripcion: "Contacto telefonico",
      estado: false,
    });
  });

  it("builds the save payload with the current user id", () => {
    expect(
      buildGuardarTipoGestionPayload({
        tipoSeleccionado: null,
        formulario: {
          nombre: "Visita",
          descripcion: "Visita presencial",
          estado: true,
        },
        tipoContacto: "CI",
        idUser: 42,
      })
    ).toEqual({
      id: 0,
      nombre: "Visita",
      descripcion: "Visita presencial",
      estado: true,
      formaContacto: "CI",
      idUser: 42,
    });
  });
});
