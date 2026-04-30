import reducer, { clearSecurity, setSecurityData } from "./security";

describe("security reducer", () => {
  it("keeps the initial security state shape", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual({
      menuTree: [],
      permissions: [],
      loaded: false,
    });
  });

  it("stores menu tree and permissions as the current security data", () => {
    const state = reducer(
      undefined,
      setSecurityData({
        menuTree: [
          {
            menuId: 1,
            menuKey: "usuarios",
            menuName: "Usuarios",
            sortOrder: 1,
            children: [],
          },
        ],
        permissions: ["usuarios.view"],
      })
    );

    expect(state).toEqual({
      menuTree: [
        {
          menuId: 1,
          menuKey: "usuarios",
          menuName: "Usuarios",
          sortOrder: 1,
          children: [],
        },
      ],
      permissions: ["usuarios.view"],
      loaded: true,
    });
  });

  it("resets security data without changing the reducer shape", () => {
    const loadedState = reducer(
      undefined,
      setSecurityData({
        menuTree: [],
        permissions: ["usuarios.view"],
      })
    );

    expect(reducer(loadedState, clearSecurity())).toEqual({
      menuTree: [],
      permissions: [],
      loaded: false,
    });
  });
});
