import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CarteraCuentaMultiSelect } from "../components/CarteraCuentaMultiSelect";

function setToSortedArray(value: Set<string>) {
  return [...value].sort();
}

describe("CarteraCuentaMultiSelect", () => {
  it("selects all and none", async () => {
    const user = userEvent.setup();
    const onSelectedValuesChange = jest.fn();

    render(
      <CarteraCuentaMultiSelect
        options={[
          { value: "01", label: "A" },
          { value: "02", label: "B" },
          { value: "03", label: "C" },
        ]}
        selectedValues={new Set(["01"])}
        onSelectedValuesChange={onSelectedValuesChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("button", { name: "Todos" }));
    expect(setToSortedArray(onSelectedValuesChange.mock.calls[0][0])).toEqual([
      "01",
      "02",
      "03",
    ]);

    await user.click(screen.getByRole("button", { name: "Ninguno" }));
    expect(setToSortedArray(onSelectedValuesChange.mock.calls[1][0])).toEqual([]);
  });
});
