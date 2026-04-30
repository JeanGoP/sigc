import {
  buildApiBaseUrl,
  buildApiHeaders,
  createApiClient,
  isAbsoluteHttpUrl,
} from "./apiClientFactory";
import axios from "axios";

jest.mock("axios", () => ({
  __esModule: true,
  create: jest.fn((config) => ({
    defaults: config,
    request: jest.fn(),
  })),
  default: {
    create: jest.fn((config) => ({
      defaults: config,
      request: jest.fn(),
    })),
  },
}));

const mockedAxios = axios as unknown as { create: jest.Mock };

describe("api client factory", () => {
  beforeEach(() => {
    mockedAxios.create.mockClear();
  });

  it("detects absolute http urls", () => {
    expect(isAbsoluteHttpUrl("https://api.example.com/api/v1")).toBe(true);
    expect(isAbsoluteHttpUrl(" http://api.example.com ")).toBe(true);
    expect(isAbsoluteHttpUrl("/api/v1")).toBe(false);
  });

  it("builds base urls from the configured API url and relative paths", () => {
    expect(buildApiBaseUrl("/api/v1", "https://api.example.com")).toBe(
      "https://api.example.com/api/v1"
    );
    expect(buildApiBaseUrl("api/v1", "https://api.example.com/")).toBe(
      "https://api.example.com/api/v1"
    );
    expect(buildApiBaseUrl("", "https://api.example.com/")).toBe(
      "https://api.example.com"
    );
  });

  it("keeps absolute urls unchanged", () => {
    expect(
      buildApiBaseUrl("https://other.example.com/api/v2", "https://api.example.com")
    ).toBe("https://other.example.com/api/v2");
  });

  it("keeps relative paths when no API url is configured", () => {
    expect(buildApiBaseUrl("/api/v1", "")).toBe("/api/v1");
  });

  it("builds headers with token and tenant", () => {
    expect(
      buildApiHeaders({
        token: "token-a",
        tenantId: "tenant-a",
      })
    ).toEqual({
      "Content-Type": "application/json",
      Accept: "*/*",
      "X-Tenant-Id": "tenant-a",
      Authorization: "Bearer token-a",
    });
  });

  it("builds headers without authorization when token is empty", () => {
    expect(buildApiHeaders({ tenantId: "tenant-a" })).toEqual({
      "Content-Type": "application/json",
      Accept: "*/*",
      "X-Tenant-Id": "tenant-a",
    });
  });

  it("creates an axios client with the resolved base url, timeout and headers", () => {
    createApiClient({
      baseURL: "/api/v1",
      apiUrl: "https://api.example.com/",
      timeout: 1234,
      authSession: {
        token: "token-a",
        tenantId: "tenant-a",
      },
    });

    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: "https://api.example.com/api/v1",
      timeout: 1234,
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        "X-Tenant-Id": "tenant-a",
        Authorization: "Bearer token-a",
      },
    });
  });
});
