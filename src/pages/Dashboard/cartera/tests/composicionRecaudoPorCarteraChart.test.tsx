import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CarteraRow } from "@app/Data/dashboardCarteraData";
import ComposicionRecaudoPorCarteraChart from "../ComposicionRecaudoPorCarteraChart";

jest.mock(
  "@app/utils/formattersFunctions",
  () => ({
    fmtCOP: (value: number) => `$${value}`,
  }),
  { virtual: true },
);

jest.mock("react-chartjs-2", () => ({
  Bar: () => <div data-testid="chart-bar" />,
  Doughnut: () => <div data-testid="chart-doughnut" />,
}));

function createRow(overrides: Partial<CarteraRow> = {}): CarteraRow {
  return {
    codicta: "01",
    desccta: "Cartera A",
    obligacionesTotal: 0,
    obligacionesPV: 0,
    obligaciones30: 0,
    obligaciones60: 0,
    obligaciones90: 0,
    obligaciones90mas: 0,
    total: 0,
    pv: 0,
    d30: 0,
    d60: 0,
    d90: 0,
    d90mas: 0,
    carteraVencida: 0,
    carteraVencidaPorc: 0,
    recaudoMesActual: 0,
    recaudoMesAnterior: 0,
    porcentajeVariacion: 0,
    indiceRecaudo: 0,
    recaudoPV: 10,
    recaudo30: 20,
    recaudo60: 30,
    recaudo90: 40,
    recaudo90mas: 50,
    recaudoVencido: 0,
    totalAnt: 0,
    pvAnt: 0,
    d30Ant: 0,
    d60Ant: 0,
    d90Ant: 0,
    d90masAnt: 0,
    pvAntPorc: 0,
    d30AntPorc: 0,
    d60AntPorc: 0,
    d90AntPorc: 0,
    d90masAntPorc: 0,
    carteraVencidaAnt: 0,
    carteraVencidaAntPorc: 0,
    ...overrides,
  };
}

describe("ComposicionRecaudoPorCarteraChart", () => {
  it("toggles between barras and dona views", async () => {
    const user = userEvent.setup();

    render(
      <ComposicionRecaudoPorCarteraChart
        data={[createRow(), createRow({ codicta: "02", desccta: "Cartera B" })]}
      />,
    );

    expect(screen.getByTestId("chart-bar")).toBeInTheDocument();
    expect(screen.queryByTestId("chart-doughnut")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Dona" }));
    expect(screen.getByTestId("chart-doughnut")).toBeInTheDocument();
    expect(screen.queryByTestId("chart-bar")).toBeNull();
    expect(screen.getByText("Cartera:")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Barras" }));
    expect(screen.getByTestId("chart-bar")).toBeInTheDocument();
  });
});
