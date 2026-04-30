import { shouldEnableReduxLogger } from "./storeConfig";

describe("store config", () => {
  it("enables redux logger in explicit development environment", () => {
    expect(shouldEnableReduxLogger({ VITE_NODE_ENV: "development" })).toBe(true);
  });

  it("disables redux logger in production environment", () => {
    expect(shouldEnableReduxLogger({ VITE_NODE_ENV: "production", DEV: true })).toBe(false);
  });

  it("uses Vite mode when the explicit environment is not configured", () => {
    expect(shouldEnableReduxLogger({ MODE: "development" })).toBe(true);
    expect(shouldEnableReduxLogger({ MODE: "production" })).toBe(false);
  });

  it("falls back to the Vite DEV flag", () => {
    expect(shouldEnableReduxLogger({ DEV: true })).toBe(true);
    expect(shouldEnableReduxLogger({ DEV: false })).toBe(false);
  });
});
