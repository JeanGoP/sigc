import {
  buildDefaultEtiquetaClienteForm,
  buildEtiquetaClienteForm,
  buildGuardarEtiquetaClientePayload,
  getEtiquetaClienteModalTitle,
  getEtiquetaClienteSuccessMessage,
} from "../domain/helpers";

describe("etiquetas cliente helpers", () => {
  it("crea form default", () => {
    expect(buildDefaultEtiquetaClienteForm()).toEqual({
      nombre: "",
      color: "#2ecc71",
      estado: true,
    });
  });

  it("crea form desde etiqueta", () => {
    expect(
      buildEtiquetaClienteForm({
        id: 8,
        nombre: "VIP",
        color: "#123456",
        estado: false,
      }),
    ).toEqual({
      nombre: "VIP",
      color: "#123456",
      estado: false,
    });
  });

  it("construye payload de guardado", () => {
    expect(
      buildGuardarEtiquetaClientePayload(
        12,
        {
          nombre: "Cobranza",
          color: "#abcdef",
          estado: true,
        },
        {
          id: 4,
          nombre: "Vieja",
          color: "#000000",
          estado: false,
        },
      ),
    ).toEqual({
      id: 4,
      nombre: "Cobranza",
      color: "#abcdef",
      estado: true,
      iduser: 12,
    });
  });

  it("devuelve titulos y mensajes correctos", () => {
    expect(getEtiquetaClienteModalTitle()).toBe("Nueva Etiqueta");
    expect(
      getEtiquetaClienteModalTitle({
        id: 1,
        nombre: "A",
        color: "#fff",
        estado: true,
      }),
    ).toBe("Editar Etiqueta");
    expect(getEtiquetaClienteSuccessMessage()).toBe("Etiqueta creada");
    expect(
      getEtiquetaClienteSuccessMessage({
        id: 1,
        nombre: "A",
        color: "#fff",
        estado: true,
      }),
    ).toBe("Etiqueta actualizada");
  });
});
