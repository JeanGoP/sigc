import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PermissionRoute from "./PermissionRoute";
import { useAppSelector } from "../store/store";
import { can } from "../utils/security";

jest.mock("../components/Loading", () => ({
  Loading: () => <div>loading-view</div>,
}));

jest.mock("../store/store", () => ({
  useAppSelector: jest.fn(),
}));

jest.mock("../utils/security", () => ({
  can: jest.fn(),
}));

type MockState = {
  auth: { currentUser: unknown | null };
  security: { loaded: boolean; permissions: string[] };
};

function renderPermissionRoute() {
  return render(
    <MemoryRouter initialEntries={["/secure"]}>
      <Routes>
        <Route
          path="/secure"
          element={
            <PermissionRoute permission="consulta_clientes.view">
              <div>secure-page</div>
            </PermissionRoute>
          }
        />
        <Route path="/login" element={<div>login-page</div>} />
        <Route path="/unauthorized" element={<div>unauthorized-page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PermissionRoute", () => {
  const mockedUseAppSelector = useAppSelector as jest.Mock;
  const mockedCan = can as jest.Mock;

  const setState = (state: MockState) => {
    mockedUseAppSelector.mockImplementation((selector: (s: MockState) => unknown) =>
      selector(state)
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to login when there is no current user", () => {
    setState({
      auth: { currentUser: null },
      security: { loaded: true, permissions: [] },
    });

    renderPermissionRoute();

    expect(screen.getByText("login-page")).toBeInTheDocument();
  });

  it("shows loading while security is not loaded", () => {
    setState({
      auth: { currentUser: { id: "1" } },
      security: { loaded: false, permissions: [] },
    });

    renderPermissionRoute();

    expect(screen.getByText("loading-view")).toBeInTheDocument();
  });

  it("redirects to unauthorized when permission is missing", () => {
    setState({
      auth: { currentUser: { id: "1" } },
      security: { loaded: true, permissions: ["consulta_carteras.view"] },
    });
    mockedCan.mockReturnValue(false);

    renderPermissionRoute();

    expect(screen.getByText("unauthorized-page")).toBeInTheDocument();
  });

  it("renders children when permission is granted", () => {
    setState({
      auth: { currentUser: { id: "1" } },
      security: { loaded: true, permissions: ["consulta_clientes.view"] },
    });
    mockedCan.mockReturnValue(true);

    renderPermissionRoute();

    expect(screen.getByText("secure-page")).toBeInTheDocument();
  });
});
