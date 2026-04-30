import {
  clearSeguimientoDraft,
  normalizeSeguimientoDraft,
  readSeguimientoDraft,
  writeSeguimientoDraft,
} from "../domain/draftStorage";
import type { SeguimientoDraftState } from "../domain/types";

describe("timeline seguimiento draft storage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it("normalizes stored draft values", () => {
    expect(
      normalizeSeguimientoDraft({
        texto: 123,
        eventos: "bad",
        tipoContacto: undefined,
        formEvento: null,
        editIndex: 1.5,
      })
    ).toEqual({
      texto: "123",
      eventos: [],
      tipoContacto: 0,
      formEvento: { id: 0, tipo: "", fecha: "", hora: null, valor: undefined },
      editIndex: null,
      updatedAt: "",
    });
  });

  it("reads, writes and clears draft state by storage key", () => {
    const draft: SeguimientoDraftState = {
      texto: "Gestion realizada",
      eventos: [{ id: 1, tipo: "Promesa" }],
      tipoContacto: 3,
      formEvento: { id: 1, tipo: "Promesa", fecha: "2026-04-27", hora: null },
      editIndex: 0,
      updatedAt: "2026-04-27T10:00:00.000Z",
    };

    writeSeguimientoDraft("draft-key", draft);
    expect(readSeguimientoDraft("draft-key")).toEqual(draft);

    clearSeguimientoDraft("draft-key");
    expect(readSeguimientoDraft("draft-key")).toBeNull();
  });

  it("returns null for empty keys and malformed JSON", () => {
    expect(readSeguimientoDraft("")).toBeNull();

    localStorage.setItem("draft-key", "{bad-json");
    expect(readSeguimientoDraft("draft-key")).toBeNull();
  });
});
