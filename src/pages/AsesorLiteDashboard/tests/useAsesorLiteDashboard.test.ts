import { renderHook, act, waitFor } from "@testing-library/react";
import { useAsesorLiteDashboard } from "../hooks/useAsesorLiteDashboard";
import { useAppSelector } from "../../../store/store";
import { useApi } from "../../../hooks/useApi";

jest.mock("../../../store/store", () => ({
  useAppSelector: jest.fn(),
}));

jest.mock("../../../hooks/useApi", () => ({
  useApi: jest.fn(),
}));

describe("useAsesorLiteDashboard hook", () => {
  const mockApiRequest = jest.fn();
  const mockUsuariosRequest = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useApi as jest.Mock).mockImplementation((_url: string, options?: { timeout?: number }) => {
      if (options?.timeout === 15000) {
        // apiUsuarios
        return {
          request: mockUsuariosRequest,
          loading: false,
          error: null,
        };
      }
      // api (dashboard)
      return {
        request: mockApiRequest,
        loading: false,
        error: null,
      };
    });
  });

  it("fetches usuarios list exactly once when user has admin role and does not loop infinitely", async () => {
    (useAppSelector as jest.Mock).mockImplementation((selector: (state: any) => any) => {
      const mockState = {
        auth: {
          currentUser: {
            id: 1,
            username: "admin",
            fullName: "Administrador Demo",
            role: "Administrador",
          },
        },
        security: {
          permissions: [],
        },
      };
      return selector(mockState);
    });

    mockUsuariosRequest.mockResolvedValue({
      success: true,
      data: [
        { userId: 1, username: "admin", fullName: "Admin Demo", email: "a@a.com", roleName: "Admin" },
        { userId: 2, username: "asesor1", fullName: "Asesor Uno", email: "b@b.com", roleName: "Asesor" },
      ],
    });

    const { result, rerender } = renderHook(() => useAsesorLiteDashboard());

    await waitFor(() => {
      expect(result.current.usuariosDisponibles).toHaveLength(2);
    });

    // Verify it was called only once
    expect(mockUsuariosRequest).toHaveBeenCalledTimes(1);

    // Re-render multiple times to ensure no infinite request loop occurs
    rerender();
    rerender();
    rerender();

    expect(mockUsuariosRequest).toHaveBeenCalledTimes(1);
  });

  it("does not fetch usuarios list if user is a standard asesor without ver_otros permission", async () => {
    (useAppSelector as jest.Mock).mockImplementation((selector: (state: any) => any) => {
      const mockState = {
        auth: {
          currentUser: {
            id: 10,
            username: "carlos",
            fullName: "Carlos Asesor",
            role: "Asesor",
          },
        },
        security: {
          permissions: [],
        },
      };
      return selector(mockState);
    });

    const { result } = renderHook(() => useAsesorLiteDashboard());

    expect(result.current.canViewOtherUsers).toBe(false);
    expect(mockUsuariosRequest).not.toHaveBeenCalled();
    expect(result.current.usuariosDisponibles).toEqual([]);
  });

  it("consultar fetches dashboard data and caches subsequent calls", async () => {
    (useAppSelector as jest.Mock).mockImplementation((selector: (state: any) => any) => {
      const mockState = {
        auth: {
          currentUser: {
            id: 10,
            username: "carlos",
            fullName: "Carlos Asesor",
            role: "Asesor",
          },
        },
        security: {
          permissions: [],
        },
      };
      return selector(mockState);
    });

    const mockDashboardData = {
      cuentasTramos: [],
      gestiones: [],
      recaudos: [],
      cartera: [],
    };

    mockApiRequest.mockResolvedValue({
      success: true,
      data: mockDashboardData,
    });

    const { result } = renderHook(() => useAsesorLiteDashboard());

    await act(async () => {
      await result.current.consultar();
    });

    expect(mockApiRequest).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockDashboardData);

    // Second call without force should use cache and not fire another request
    await act(async () => {
      await result.current.consultar();
    });

    expect(mockApiRequest).toHaveBeenCalledTimes(1);

    // Third call with force: true should bypass cache
    await act(async () => {
      await result.current.consultar({ force: true });
    });

    expect(mockApiRequest).toHaveBeenCalledTimes(2);
  });
});
