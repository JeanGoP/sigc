import { renderHook, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import { useSessionBootstrap } from "./useSessionBootstrap";
import { useAppDispatch } from "../store/store";
import { useLocation } from "react-router-dom";
import { useSessionService } from "../services/Auth/ValidateToken";
import { useSecurityService } from "../services/Security/securityService";
import { AUTH_STORAGE_KEY } from "../services/Auth/authStorage";

jest.mock("../store/store", () => ({
  useAppDispatch: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn(),
}));

jest.mock("../services/Auth/ValidateToken", () => ({
  useSessionService: jest.fn(),
}));

jest.mock("../services/Security/securityService", () => ({
  useSecurityService: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    info: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("useSessionBootstrap", () => {
  const dispatchMock = jest.fn();
  const validateTokenMock = jest.fn();
  const getSecurityMeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    (useAppDispatch as jest.Mock).mockReturnValue(dispatchMock);
    (useLocation as jest.Mock).mockReturnValue({ pathname: "/profile" });
    (useSessionService as jest.Mock).mockReturnValue({
      validateToken: validateTokenMock,
    });
    (useSecurityService as jest.Mock).mockReturnValue({
      getSecurityMe: getSecurityMeMock,
    });
  });

  it("clears security on public paths and stops loading", async () => {
    (useLocation as jest.Mock).mockReturnValue({ pathname: "/login" });

    const { result } = renderHook(() => useSessionBootstrap());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "security/clearSecurity" })
    );
  });

  it("resets user/security and shows info toast when no stored session exists", async () => {
    const { result } = renderHook(() => useSessionBootstrap());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "auth/setCurrentUser", payload: null })
    );
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "security/clearSecurity" })
    );
    expect(toast.info).toHaveBeenCalled();
  });

  it("loads security and persists refreshed user when session is valid", async () => {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        id: "1",
        username: "user1",
        password: "",
        fullName: "Test User",
        email: "user@test.com",
        role: "advisor",
        token: "token-123",
        tenantId: "tenant-1",
        mustChangePassword: false,
        telephonyEnabled: true,
      })
    );

    validateTokenMock.mockResolvedValue({
      valid: true,
      user: {
        id: "1",
        username: "user1",
        password: "",
        fullName: "Test User",
        email: "user@test.com",
        role: "advisor",
        token: "token-123",
        tenantId: "tenant-1",
        mustChangePassword: false,
        telephonyEnabled: true,
      },
    });

    getSecurityMeMock.mockResolvedValue({
      success: true,
      data: {
        userId: "1",
        username: "user1",
        roleName: "advisor",
        fullName: "Test User",
        email: "user@test.com",
        token: "token-123",
        tenantId: "tenant-1",
        mustChangePassword: false,
        telephonyEnabled: true,
        menuTree: [],
        permissions: ["consulta_clientes.view"],
      },
    });

    const { result } = renderHook(() => useSessionBootstrap());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "security/setSecurityData",
        payload: expect.objectContaining({
          permissions: ["consulta_clientes.view"],
        }),
      })
    );
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain("user1");
  });
});
