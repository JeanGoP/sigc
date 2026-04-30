import type { GridPaginationModel } from "@mui/x-data-grid";
import {
  buildClientesListRequest,
  buildFacturaSeleccionada,
  buildSeguimientoButtonTitle,
  shouldSearchClientes,
  toSelectedClienteValue,
  toggleSelectedRow,
} from "./helpers";

describe("consulta clientes helpers", () => {
  it("toggles selected rows", () => {
    expect(toggleSelectedRow([], "1")).toEqual(["1"]);
    expect(toggleSelectedRow(["1", "2"], "1")).toEqual(["2"]);
  });

  it("builds list request from pagination and filters", () => {
    const paginationModel: GridPaginationModel = { page: 2, pageSize: 50 };
    expect(buildClientesListRequest(paginationModel, "3.00", "foo")).toEqual({
      page: 3,
      numpage: 50,
      filter: "foo",
      intmora: "3.00",
    });
  });

  it("applies current search threshold", () => {
    expect(shouldSearchClientes("ab")).toBe(false);
    expect(shouldSearchClientes("abc")).toBe(true);
  });

  it("normalizes selected cliente value", () => {
    expect(toSelectedClienteValue({ id: " 123 " })).toBe("123");
    expect(toSelectedClienteValue({})).toBe("");
  });

  it("builds factura selection from supported field names", () => {
    expect(
      buildFacturaSeleccionada(
        { CUENTA: "001", NUMEFAC: "F-1", cliente: "9001" },
        ""
      )
    ).toEqual({
      cuenta: "001",
      factura: "F-1",
      identificacionCliente: "9001",
    });

    expect(
      buildFacturaSeleccionada(
        { cuenta: "002", factura: "F-2", identificacionCliente: "9002" },
        ""
      )
    ).toEqual({
      cuenta: "002",
      factura: "F-2",
      identificacionCliente: "9002",
    });
  });

  it("returns null factura selection when mandatory values are missing", () => {
    expect(buildFacturaSeleccionada({}, "123")).toBeNull();
  });

  it("returns seguimiento button title based on selection", () => {
    expect(buildSeguimientoButtonTitle(null)).toContain("Seleccione");
    expect(
      buildSeguimientoButtonTitle({
        cuenta: "1",
        factura: "2",
        identificacionCliente: "3",
      })
    ).toContain("Ir a consulta");
  });
});
