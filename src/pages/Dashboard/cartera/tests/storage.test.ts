import {
  DASHBOARD_CARTERA_STORAGE_KEY,
  loadDashboardCarteraDataset,
  parseDashboardCarteraDataset,
  saveDashboardCarteraDataset,
} from "../domain/storage";

type MemoryStorage = {
  getItem: jest.Mock<string | null, [string]>;
  setItem: jest.Mock<void, [string, string]>;
};

function createMemoryStorage(initialValue?: string): MemoryStorage {
  const values = new Map<string, string>();

  if (initialValue !== undefined) {
    values.set(DASHBOARD_CARTERA_STORAGE_KEY, initialValue);
  }

  return {
    getItem: jest.fn((key: string) => values.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

describe("dashboard cartera storage", () => {
  it("parses only valid persisted datasets", () => {
    expect(parseDashboardCarteraDataset(null)).toBeNull();
    expect(parseDashboardCarteraDataset("{bad-json")).toBeNull();
    expect(parseDashboardCarteraDataset("[]")).toBeNull();
    expect(
      parseDashboardCarteraDataset(
        JSON.stringify({ fecha: "2026-04-28", data: [] }),
      ),
    ).toEqual({
      fecha: "2026-04-28",
      data: [],
    });
  });

  it("loads the stored dataset when present", () => {
    const storage = createMemoryStorage(
      JSON.stringify({
        fecha: "2026-04-28",
        data: [{ codicta: "01", desccta: "A" }],
      }),
    );

    expect(loadDashboardCarteraDataset(storage)).toEqual({
      fecha: "2026-04-28",
      data: [{ codicta: "01", desccta: "A" }],
    });
  });

  it("saves the dataset using the stable storage key", () => {
    const storage = createMemoryStorage();

    saveDashboardCarteraDataset(
      {
        fecha: "2026-04-28",
        data: [],
      },
      storage,
    );

    expect(storage.setItem).toHaveBeenCalledWith(
      DASHBOARD_CARTERA_STORAGE_KEY,
      JSON.stringify({
        fecha: "2026-04-28",
        data: [],
      }),
    );
  });
});
