import {
  buildFormularioUsuarioDesdeUsuario,
  buildSaveUserPayload,
  buildUsuariosEstadisticas,
  filterUsuarios,
} from "../domain/helpers";

const usuarios = [
  {
    userId: 1,
    username: "ana",
    fullName: "Ana Perez",
    email: "ana@example.com",
    isActive: true,
    roleId: 10,
    roleName: "Asesor",
  },
  {
    userId: 2,
    username: "carlos",
    fullName: "Carlos Ruiz",
    email: "carlos@example.com",
    isActive: false,
    roleId: 20,
    roleName: "Supervisor",
  },
];

describe("usuarios helpers", () => {
  it("builds user statistics", () => {
    expect(buildUsuariosEstadisticas(usuarios)).toEqual({
      total: 2,
      activos: 1,
      inactivos: 1,
    });
  });

  it("filters users by text, role and status", () => {
    expect(
      filterUsuarios({
        usuarios,
        textoBusqueda: "ana",
        filtroRol: "10",
        filtroEstado: "activos",
      })
    ).toEqual([usuarios[0]]);
  });

  it("builds form state from an existing user", () => {
    expect(buildFormularioUsuarioDesdeUsuario(usuarios[0])).toEqual({
      username: "ana",
      password: "",
      fullName: "Ana Perez",
      email: "ana@example.com",
      roleId: "10",
      isActive: true,
    });
  });

  it("trims and normalizes the save payload", () => {
    expect(
      buildSaveUserPayload({
        username: " ana ",
        password: " ",
        fullName: " Ana Perez ",
        email: " ana@example.com ",
        roleId: "",
        isActive: true,
      })
    ).toEqual({
      username: "ana",
      password: undefined,
      fullName: "Ana Perez",
      email: "ana@example.com",
      roleId: null,
      isActive: true,
    });
  });
});
