import {
  buildConsultaCarteraMailPayload,
  getDefaultPlantillaCorreoKey,
  normalizePlantillasCorreo,
} from "./mail";

describe("consulta cartera mail helpers", () => {
  it("normalizes mail templates preserving current order", () => {
    expect(normalizePlantillasCorreo(null)).toEqual([]);

    expect(
      normalizePlantillasCorreo([
        { nombre: " Aviso 1 ", key: " TMP-1 " },
        { nombre: null as unknown as string, key: undefined as unknown as string },
      ])
    ).toEqual([
      { nombre: "Aviso 1", key: "TMP-1" },
      { nombre: "", key: "" },
    ]);
  });

  it("uses the first template key as the default selected option", () => {
    expect(getDefaultPlantillaCorreoKey([])).toBe("");
    expect(
      getDefaultPlantillaCorreoKey([
        { nombre: "Aviso 1", key: "TMP-1" },
        { nombre: "Aviso 2", key: "TMP-2" },
      ])
    ).toBe("TMP-1");
  });

  it("builds the send-with-template payload with trimmed values", () => {
    expect(
      buildConsultaCarteraMailPayload({
        fechaConsultaFacturas: " 2026-04-28 ",
        plantillaSeleccionadaKey: " TMP-7 ",
        registroSeleccionado: {
          cliente: " CLI-1 ",
          factura: " FAC-9 ",
          cuenta: " CU-3 ",
        },
        currentUserId: "12",
      })
    ).toEqual({
      cliente: "CLI-1",
      factura: "FAC-9",
      cuenta: "CU-3",
      plantillaKey: "TMP-7",
      fecha: "2026-04-28",
      idUser: 12,
    });
  });
});
