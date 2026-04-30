import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { can } from "@app/utils/security";
import { useAppSelector } from "@app/store/store";
import { useParametrizacionService } from "@app/services/Parametrizacion/parametrizacionService";
import type {
  ParametrizacionRole,
  ParametrizacionUser,
} from "@app/services/Parametrizacion/types";
import { FILTRO_ESTADO_OPTIONS, FORMULARIO_USUARIO_VACIO } from "../domain/constants";
import {
  buildFormularioUsuarioDesdeUsuario,
  buildSaveUserPayload,
  buildUsuariosEstadisticas,
  filterUsuarios,
} from "../domain/helpers";
import type { FiltroEstado, FormularioUsuarioState } from "../domain/types";

export function useUsuariosPage() {
  const permisos = useAppSelector((state) => state.security.permissions);
  const puedeCrear = can(permisos, "usuarios.create");
  const puedeEditar = can(permisos, "usuarios.edit");
  const puedeCambiarContrasena = can(permisos, "usuarios.change_password");

  const {
    loading,
    listarUsuarios,
    listarRoles,
    crearUsuario,
    actualizarUsuario,
    cambiarEstadoUsuario,
    cambiarPasswordUsuario,
  } = useParametrizacionService();

  const [usuarios, setUsuarios] = useState<ParametrizacionUser[]>([]);
  const [roles, setRoles] = useState<ParametrizacionRole[]>([]);
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState<number | null>(null);
  const [formularioUsuario, setFormularioUsuario] = useState<FormularioUsuarioState>(
    FORMULARIO_USUARIO_VACIO
  );
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);

  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

  const [usuarioParaContrasena, setUsuarioParaContrasena] =
    useState<ParametrizacionUser | null>(null);
  const [nuevaContrasena, setNuevaContrasena] = useState("");

  const usuarioSeleccionado = useMemo(
    () => usuarios.find((usuario) => usuario.userId === usuarioSeleccionadoId) ?? null,
    [usuarios, usuarioSeleccionadoId]
  );

  const estadisticas = useMemo(
    () => buildUsuariosEstadisticas(usuarios),
    [usuarios]
  );

  const usuariosFiltrados = useMemo(
    () =>
      filterUsuarios({
        usuarios,
        textoBusqueda,
        filtroRol,
        filtroEstado,
      }),
    [usuarios, textoBusqueda, filtroRol, filtroEstado]
  );

  const cargarDatos = useCallback(async () => {
    const [respuestaUsuarios, respuestaRoles] = await Promise.all([
      listarUsuarios(),
      listarRoles(),
    ]);

    if (respuestaUsuarios?.success) {
      setUsuarios(respuestaUsuarios.data ?? []);
    } else if (respuestaUsuarios) {
      toast.error(respuestaUsuarios.message || "No fue posible cargar los usuarios");
    }

    if (respuestaRoles?.success) {
      setRoles(respuestaRoles.data ?? []);
    } else if (respuestaRoles) {
      toast.error(respuestaRoles.message || "No fue posible cargar los roles");
    }
  }, [listarRoles, listarUsuarios]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    setPagina(0);
  }, [textoBusqueda, filtroRol, filtroEstado]);

  const limpiarFormularioUsuario = useCallback(() => {
    setUsuarioSeleccionadoId(null);
    setFormularioUsuario(FORMULARIO_USUARIO_VACIO);
  }, []);

  const abrirModalNuevoUsuario = useCallback(() => {
    limpiarFormularioUsuario();
    setModalUsuarioAbierto(true);
  }, [limpiarFormularioUsuario]);

  const abrirModalEditarUsuario = useCallback((usuario: ParametrizacionUser) => {
    setUsuarioSeleccionadoId(usuario.userId);
    setFormularioUsuario(buildFormularioUsuarioDesdeUsuario(usuario));
    setModalUsuarioAbierto(true);
  }, []);

  const cerrarModalUsuario = useCallback(() => {
    setModalUsuarioAbierto(false);
    limpiarFormularioUsuario();
  }, [limpiarFormularioUsuario]);

  const limpiarFiltros = useCallback(() => {
    setTextoBusqueda("");
    setFiltroRol("");
    setFiltroEstado("todos");
  }, []);

  const abrirModalCambioContrasena = useCallback((usuario: ParametrizacionUser) => {
    setUsuarioParaContrasena(usuario);
  }, []);

  const cerrarModalContrasena = useCallback(() => {
    setUsuarioParaContrasena(null);
    setNuevaContrasena("");
  }, []);

  const actualizarCampoFormularioUsuario = useCallback(
    <K extends keyof FormularioUsuarioState>(
      campo: K,
      valor: FormularioUsuarioState[K]
    ) => {
      setFormularioUsuario((previous) => ({
        ...previous,
        [campo]: valor,
      }));
    },
    []
  );

  const guardarUsuario = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!puedeCrear && !usuarioSeleccionadoId) {
        toast.error("No tienes permisos para crear usuarios");
        return;
      }

      if (!puedeEditar && usuarioSeleccionadoId) {
        toast.error("No tienes permisos para editar usuarios");
        return;
      }

      const payload = buildSaveUserPayload(formularioUsuario);
      if (!payload.username || !payload.fullName || !payload.email) {
        toast.error("Usuario, nombre completo y correo electronico son obligatorios");
        return;
      }

      if (!usuarioSeleccionadoId && !payload.password) {
        toast.error("La contrasena es obligatoria para crear el usuario");
        return;
      }

      try {
        setGuardandoUsuario(true);
        const respuesta = usuarioSeleccionadoId
          ? await actualizarUsuario(usuarioSeleccionadoId, payload)
          : await crearUsuario(payload);

        if (respuesta?.success) {
          toast.success(respuesta.message || "Usuario guardado exitosamente");
          await cargarDatos();
          cerrarModalUsuario();
          return;
        }

        toast.error(respuesta?.message || "No fue posible guardar el usuario");
      } finally {
        setGuardandoUsuario(false);
      }
    },
    [
      actualizarUsuario,
      cargarDatos,
      cerrarModalUsuario,
      crearUsuario,
      formularioUsuario,
      puedeCrear,
      puedeEditar,
      usuarioSeleccionadoId,
    ]
  );

  const cambiarEstado = useCallback(
    async (usuario: ParametrizacionUser) => {
      if (!puedeEditar) {
        toast.error("No tienes permisos para cambiar el estado de usuarios");
        return;
      }

      const respuesta = await cambiarEstadoUsuario(usuario.userId, !usuario.isActive);
      if (respuesta?.success) {
        toast.success(respuesta.message || "Estado actualizado");
        await cargarDatos();
        return;
      }

      toast.error(respuesta?.message || "No fue posible cambiar el estado");
    },
    [cambiarEstadoUsuario, cargarDatos, puedeEditar]
  );

  const actualizarContrasena = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!usuarioParaContrasena) {
        return;
      }

      if (!puedeCambiarContrasena) {
        toast.error("No tienes permisos para cambiar contrasenas");
        return;
      }

      if (nuevaContrasena.trim().length < 5) {
        toast.error("La nueva contrasena debe tener al menos 5 caracteres");
        return;
      }

      const respuesta = await cambiarPasswordUsuario(
        usuarioParaContrasena.userId,
        nuevaContrasena.trim()
      );

      if (respuesta?.success) {
        toast.success(respuesta.message || "Contrasena actualizada");
        cerrarModalContrasena();
        return;
      }

      toast.error(respuesta?.message || "No fue posible cambiar la contrasena");
    },
    [
      cambiarPasswordUsuario,
      cerrarModalContrasena,
      nuevaContrasena,
      puedeCambiarContrasena,
      usuarioParaContrasena,
    ]
  );

  return {
    puedeCrear,
    puedeEditar,
    puedeCambiarContrasena,
    loading,
    usuarios,
    roles,
    usuarioSeleccionadoId,
    usuarioSeleccionado,
    formularioUsuario,
    guardandoUsuario,
    modalUsuarioAbierto,
    textoBusqueda,
    filtroRol,
    filtroEstado,
    pagina,
    filasPorPagina,
    usuarioParaContrasena,
    nuevaContrasena,
    estadisticas,
    usuariosFiltrados,
    filtroEstadoOptions: FILTRO_ESTADO_OPTIONS,
    setTextoBusqueda,
    setFiltroRol,
    setFiltroEstado,
    setPagina,
    setFilasPorPagina,
    setNuevaContrasena,
    abrirModalNuevoUsuario,
    abrirModalEditarUsuario,
    cerrarModalUsuario,
    limpiarFiltros,
    abrirModalCambioContrasena,
    cerrarModalContrasena,
    actualizarCampoFormularioUsuario,
    guardarUsuario,
    cambiarEstado,
    actualizarContrasena,
  };
}
