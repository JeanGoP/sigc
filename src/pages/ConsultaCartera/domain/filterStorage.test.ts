import {
  clearConsultaCarteraFilters,
  CONSULTA_CARTERA_FILTERS_STORAGE_KEY,
  ensureConsultaCarteraFilters,
  hasConsultaCarteraStoredFilters,
  loadConsultaCarteraFilters,
  loadConsultaCarteraStoredFilters,
  parseConsultaCarteraStoredFilters,
  saveConsultaCarteraFilters,
  updateConsultaCarteraFilterProperty,
} from "./filterStorage";

type MemoryStorage = {
  getItem: jest.Mock<string | null, [string]>;
  setItem: jest.Mock<void, [string, string]>;
  removeItem: jest.Mock<void, [string]>;
};

function createMemoryStorage(initialValue?: string): MemoryStorage {
  const values = new Map<string, string>();
  if (initialValue !== undefined) {
    values.set(CONSULTA_CARTERA_FILTERS_STORAGE_KEY, initialValue);
  }

  return {
    getItem: jest.fn((key: string) => values.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn((key: string) => {
      values.delete(key);
    }),
  };
}

describe("consulta cartera filter storage", () => {
  it("parses stored filters only when the JSON is a plain object", () => {
    expect(parseConsultaCarteraStoredFilters(null)).toBeNull();
    expect(parseConsultaCarteraStoredFilters("{bad-json")).toBeNull();
    expect(parseConsultaCarteraStoredFilters("[]")).toBeNull();
    expect(
      parseConsultaCarteraStoredFilters(
        JSON.stringify({ checkIncluirSaldosCero: true, cuenta: "123" })
      )
    ).toEqual({
      checkIncluirSaldosCero: true,
      cuenta: "123",
    });
  });

  it("loads the filters model and normalizes invalid values", () => {
    const storage = createMemoryStorage(
      JSON.stringify({
        checkIncluirSaldosCero: true,
        sinGestionDias: 99,
        cuenta: "CU-1",
      })
    );

    expect(loadConsultaCarteraStoredFilters(storage)).toEqual({
      checkIncluirSaldosCero: true,
      sinGestionDias: 99,
      cuenta: "CU-1",
    });

    expect(loadConsultaCarteraFilters(storage)).toMatchObject({
      checkIncluirSaldosCero: true,
      sinGestionDias: 0,
      cuenta: "CU-1",
    });
  });

  it("ensures default filters exist when storage is empty", () => {
    const storage = createMemoryStorage();

    expect(hasConsultaCarteraStoredFilters(storage)).toBe(false);

    const defaults = ensureConsultaCarteraFilters(storage);

    expect(defaults).toMatchObject({
      checkIncluirSaldosCero: false,
      checkSoloAsignadas: false,
      checkSoloEventosPendientes: false,
      sinGestionDias: 0,
      filtroEdadMora: "",
      filtroPorVencimiento: "",
      tipoEvento: "X",
      etiqueta: "X",
      cuenta: "",
      minValorCuota: null,
      maxValorCuota: null,
    });
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(hasConsultaCarteraStoredFilters(storage)).toBe(true);
  });

  it("saves and clears the stored filters", () => {
    const storage = createMemoryStorage();

    saveConsultaCarteraFilters(
      {
        cuenta: "55",
        checkSoloAsignadas: true,
      },
      storage
    );

    expect(loadConsultaCarteraStoredFilters(storage)).toEqual({
      cuenta: "55",
      checkSoloAsignadas: true,
    });

    clearConsultaCarteraFilters(storage);

    expect(loadConsultaCarteraStoredFilters(storage)).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(
      CONSULTA_CARTERA_FILTERS_STORAGE_KEY
    );
  });

  it("updates one stored property without dropping the existing filters", () => {
    const storage = createMemoryStorage(
      JSON.stringify({
        cuenta: "A-1",
        checkIncluirSaldosCero: true,
      })
    );

    updateConsultaCarteraFilterProperty("fechaConsulta", "2026-04-26", storage);

    expect(loadConsultaCarteraStoredFilters(storage)).toEqual({
      cuenta: "A-1",
      checkIncluirSaldosCero: true,
      fechaConsulta: "2026-04-26",
    });
  });
});
