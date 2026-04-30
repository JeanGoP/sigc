import { can, normalizePermissionCode } from "./security";

describe("security helpers", () => {
  it("normalizes permission codes with trim and lowercase", () => {
    expect(normalizePermissionCode(" Usuarios.View ")).toBe("usuarios.view");
  });

  it("matches permissions ignoring case and surrounding spaces", () => {
    expect(can([" Usuarios.View "], "usuarios.view")).toBe(true);
    expect(can(["usuarios.view"], " USUARIOS.VIEW ")).toBe(true);
  });

  it("returns false for missing permission collections", () => {
    expect(can(undefined, "usuarios.view")).toBe(false);
    expect(can(null, "usuarios.view")).toBe(false);
    expect(can([], "usuarios.view")).toBe(false);
  });

  it("returns false for empty target permission codes", () => {
    expect(can(["usuarios.view"], "")).toBe(false);
    expect(can([""], "   ")).toBe(false);
  });

  it("returns false when the permission is not present", () => {
    expect(can(["usuarios.view"], "usuarios.edit")).toBe(false);
  });
});
