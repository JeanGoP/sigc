import type {
  ParametrizacionUser,
  SaveUserPayload,
} from "@app/services/Parametrizacion/types";
import { FORMULARIO_USUARIO_VACIO } from "./constants";
import type {
  FiltroEstado,
  FormularioUsuarioState,
  UsuariosEstadisticas,
} from "./types";

export function buildFormularioUsuarioDesdeUsuario(
  usuario: ParametrizacionUser | null | undefined
): FormularioUsuarioState {
  if (!usuario) {
    return FORMULARIO_USUARIO_VACIO;
  }

  return {
    username: usuario.username ?? "",
    password: "",
    fullName: usuario.fullName ?? "",
    email: usuario.email ?? "",
    roleId: usuario.roleId ? String(usuario.roleId) : "",
    isActive: usuario.isActive,
  };
}

export function buildSaveUserPayload(
  formularioUsuario: FormularioUsuarioState
): SaveUserPayload {
  return {
    username: formularioUsuario.username.trim(),
    password: formularioUsuario.password.trim() || undefined,
    fullName: formularioUsuario.fullName.trim(),
    email: formularioUsuario.email.trim(),
    roleId: formularioUsuario.roleId ? Number(formularioUsuario.roleId) : null,
    isActive: formularioUsuario.isActive,
  };
}

export function buildUsuariosEstadisticas(
  usuarios: ParametrizacionUser[]
): UsuariosEstadisticas {
  const activos = usuarios.filter((usuario) => usuario.isActive).length;

  return {
    total: usuarios.length,
    activos,
    inactivos: usuarios.length - activos,
  };
}

export function filterUsuarios(input: {
  usuarios: ParametrizacionUser[];
  textoBusqueda: string;
  filtroRol: string;
  filtroEstado: FiltroEstado;
}): ParametrizacionUser[] {
  const { usuarios, textoBusqueda, filtroRol, filtroEstado } = input;
  const busqueda = textoBusqueda.trim().toLowerCase();

  return usuarios.filter((usuario) => {
    const usuarioTexto = String(usuario.username ?? "").toLowerCase();
    const nombreTexto = String(usuario.fullName ?? "").toLowerCase();
    const correoTexto = String(usuario.email ?? "").toLowerCase();

    const coincideBusqueda =
      busqueda.length === 0
      || usuarioTexto.includes(busqueda)
      || nombreTexto.includes(busqueda)
      || correoTexto.includes(busqueda);

    const coincideRol = !filtroRol || String(usuario.roleId ?? "") === filtroRol;

    const coincideEstado =
      filtroEstado === "todos"
      || (filtroEstado === "activos" && usuario.isActive)
      || (filtroEstado === "inactivos" && !usuario.isActive);

    return coincideBusqueda && coincideRol && coincideEstado;
  });
}
