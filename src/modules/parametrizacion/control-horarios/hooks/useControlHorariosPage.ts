import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { can } from "@app/utils/security";
import { useAppSelector } from "@app/store/store";
import { useControlHorarioService } from "@app/services/Parametrizacion/controlHorarioService";
import { useParametrizacionService } from "@app/services/Parametrizacion/parametrizacionService";
import type {
  ControlHorarioConfig,
  ControlHorarioFullConfig,
  Festivo,
  HorarioLaboralDia,
  LogAuditoriaHorario,
  PermisoHorario,
} from "@app/services/Parametrizacion/controlHorarioTypes";
import type { ParametrizacionUser } from "@app/services/Parametrizacion/types";

export function useControlHorariosPage() {
  const permissions = useAppSelector((state) => state.security.permissions);

  const canEditHorario = useMemo(
    () => can(permissions, "control_horarios.edit_horario"),
    [permissions]
  );
  const canAssignPermiso = useMemo(
    () => can(permissions, "control_horarios.assign_permiso"),
    [permissions]
  );
  const canRevokePermiso = useMemo(
    () => can(permissions, "control_horarios.revoke_permiso"),
    [permissions]
  );

  const {
    loading: apiLoading,
    getConfig,
    updateGeneralConfig,
    updateHorariosSemana,
    upsertFestivo,
    deleteFestivo,
    listarPermisos,
    asignarPermisosMasivo,
    revocarPermiso,
    listarAuditoria,
  } = useControlHorarioService();

  const { listarUsuarios } = useParametrizacionService();

  const [activeTab, setActiveTab] = useState<"horarios" | "permisos" | "auditoria">("horarios");
  const [loading, setLoading] = useState(true);

  // Datos del backend
  const [generalConfig, setGeneralConfig] = useState<ControlHorarioConfig>({
    id: 1,
    controlHorarioActivo: true,
    minutosToleranciaSalida: 0,
    bloquearAgendamientoFueraHorario: true,
    adminPuedeAgendarFueraHorario: true,
  });
  const [horariosSemana, setHorariosSemana] = useState<HorarioLaboralDia[]>([]);
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [permisos, setPermisos] = useState<PermisoHorario[]>([]);
  const [auditoriaLogs, setAuditoriaLogs] = useState<LogAuditoriaHorario[]>([]);
  const [usuariosSistema, setUsuariosSistema] = useState<ParametrizacionUser[]>([]);

  // Estados de carga específicos
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingSemana, setIsSavingSemana] = useState(false);
  const [isSubmittingFestivo, setIsSubmittingFestivo] = useState(false);
  const [isAssigningPermisos, setIsAssigningPermisos] = useState(false);
  const [isRevokingPermiso, setIsRevokingPermiso] = useState(false);

  // Filtros de permisos
  const [filtroSoloActivos, setFiltroSoloActivos] = useState(false);
  const [filtroFechaPermiso, setFiltroFechaPermiso] = useState("");
  const [busquedaPermiso, setBusquedaPermiso] = useState("");

  // Modal de Asignación Masiva
  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [fechaAsignacion, setFechaAsignacion] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [horaInicioAsignacion, setHoraInicioAsignacion] = useState("17:00");
  const [horaFinAsignacion, setHoraFinAsignacion] = useState("20:00");
  const [motivoAsignacion, setMotivoAsignacion] = useState("");
  const [busquedaUsuarioModal, setBusquedaUsuarioModal] = useState("");

  // Modal de Revocación
  const [permisoParaRevocar, setPermisoParaRevocar] = useState<PermisoHorario | null>(null);
  const [motivoRevocacion, setMotivoRevocacion] = useState("");

  // Modal de Nuevo Festivo
  const [modalFestivoAbierto, setModalFestivoAbierto] = useState(false);
  const [festivoFecha, setFestivoFecha] = useState("");
  const [festivoDescripcion, setFestivoDescripcion] = useState("");
  const [festivoEsLaboral, setFestivoEsLaboral] = useState(false);

  // Carga inicial
  const cargarDatos = useCallback(async (forzarRefresco = false) => {
    try {
      setLoading(true);
      const [resConfig, resPermisos, resUsers, resAudit] = await Promise.all([
        getConfig(forzarRefresco),
        listarPermisos(filtroSoloActivos, filtroFechaPermiso),
        listarUsuarios(),
        listarAuditoria(150),
      ]);

      if (resConfig?.success && resConfig.data) {
        const full: ControlHorarioFullConfig = resConfig.data;
        if (full.general) setGeneralConfig(full.general);
        if (full.horariosSemana) setHorariosSemana(full.horariosSemana);
        if (full.festivos) setFestivos(full.festivos);
      }

      if (resPermisos?.success && resPermisos.data) {
        setPermisos(resPermisos.data);
      }

      if (resUsers?.success && Array.isArray(resUsers.data)) {
        setUsuariosSistema(resUsers.data);
      }

      if (resAudit?.success && Array.isArray(resAudit.data)) {
        setAuditoriaLogs(resAudit.data);
      }
    } catch (err: any) {
      toast.error("Error al cargar la información de horarios: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getConfig, listarPermisos, listarUsuarios, listarAuditoria, filtroSoloActivos, filtroFechaPermiso]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Manejo de Configuración General
  const handleGuardarConfigGeneral = async (
    nuevoEstado: boolean,
    nuevaTolerancia: number,
    nuevoBloqueoAgendamiento: boolean,
    nuevoAdminBypass: boolean
  ) => {
    try {
      setIsSavingGeneral(true);
      const res = await updateGeneralConfig({
        controlHorarioActivo: nuevoEstado,
        minutosToleranciaSalida: nuevaTolerancia,
        bloquearAgendamientoFueraHorario: nuevoBloqueoAgendamiento,
        adminPuedeAgendarFueraHorario: nuevoAdminBypass,
      });

      if (res?.success) {
        setGeneralConfig((prev) => ({
          ...prev,
          controlHorarioActivo: nuevoEstado,
          minutosToleranciaSalida: nuevaTolerancia,
          bloquearAgendamientoFueraHorario: nuevoBloqueoAgendamiento,
          adminPuedeAgendarFueraHorario: nuevoAdminBypass,
        }));
        toast.success("Configuración general guardada exitosamente");
      } else {
        toast.error(res?.message || "Error al actualizar la configuración general");
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsSavingGeneral(false);
    }
  };

  // Manejo de Horarios de la Semana
  const handleUpdateDiaHorario = (diaSemana: number, field: "esLaboral" | "horaInicio" | "horaFin", value: any) => {
    setHorariosSemana((prev) =>
      prev.map((d) => (d.diaSemana === diaSemana ? { ...d, [field]: value } : d))
    );
  };

  const handleGuardarHorariosSemana = async () => {
    try {
      setIsSavingSemana(true);
      const res = await updateHorariosSemana({ dias: horariosSemana });
      if (res?.success) {
        toast.success("Horario semanal guardado exitosamente");
      } else {
        toast.error(res?.message || "Error al guardar el horario semanal");
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsSavingSemana(false);
    }
  };

  // Manejo de Festivos
  const handleGuardarFestivo = async () => {
    if (!festivoFecha || !festivoDescripcion.trim()) {
      toast.warning("Debe ingresar la fecha y una descripción para el día festivo");
      return;
    }

    try {
      setIsSubmittingFestivo(true);
      const res = await upsertFestivo({
        fecha: festivoFecha,
        descripcion: festivoDescripcion.trim(),
        esLaboral: festivoEsLaboral,
      });

      if (res?.success) {
        toast.success("Festivo guardado exitosamente");
        setModalFestivoAbierto(false);
        setFestivoFecha("");
        setFestivoDescripcion("");
        setFestivoEsLaboral(false);
        // Recargar config
        const confRes = await getConfig();
        if (confRes?.success && confRes.data?.festivos) {
          setFestivos(confRes.data.festivos);
        }
      } else {
        toast.error(res?.message || "Error al guardar el festivo");
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsSubmittingFestivo(false);
    }
  };

  const handleEliminarFestivo = async (fecha: string) => {
    if (!window.confirm(`¿Está seguro de eliminar el festivo de la fecha ${fecha}?`)) {
      return;
    }

    try {
      const res = await deleteFestivo(fecha);
      if (res?.success) {
        toast.success("Festivo eliminado exitosamente");
        setFestivos((prev) => prev.filter((f) => f.fecha !== fecha));
      } else {
        toast.error(res?.message || "Error al eliminar festivo");
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  // Manejo de Permisos
  const handleToggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAllUsers = (usersToSelect: ParametrizacionUser[]) => {
    setSelectedUserIds((prev) => {
      const allSelected = usersToSelect.every((u) => prev.has(u.userId));
      if (allSelected) {
        return new Set();
      }
      return new Set(usersToSelect.map((u) => u.userId));
    });
  };

  const handleAbrirModalAsignar = () => {
    setSelectedUserIds(new Set());
    setFechaAsignacion(new Date().toISOString().split("T")[0]);
    setHoraInicioAsignacion("17:00");
    setHoraFinAsignacion("20:00");
    setMotivoAsignacion("");
    setBusquedaUsuarioModal("");
    setModalAsignarAbierto(true);
  };

  const handleGuardarPermisosMasivo = async () => {
    if (selectedUserIds.size === 0) {
      toast.warning("Debe seleccionar al menos un usuario para otorgar el permiso");
      return;
    }
    if (!fechaAsignacion) {
      toast.warning("Debe ingresar la fecha del permiso");
      return;
    }
    if (!horaInicioAsignacion || !horaFinAsignacion) {
      toast.warning("Debe ingresar la franja horaria (Hora Inicio y Hora Fin)");
      return;
    }
    if (horaInicioAsignacion >= horaFinAsignacion) {
      toast.warning("La Hora Fin debe ser posterior a la Hora Inicio");
      return;
    }

    try {
      setIsAssigningPermisos(true);
      const res = await asignarPermisosMasivo({
        userIds: Array.from(selectedUserIds),
        fecha: fechaAsignacion,
        horaInicio: `${horaInicioAsignacion}:00`,
        horaFin: `${horaFinAsignacion}:00`,
        motivo: motivoAsignacion.trim() || undefined,
      });

      if (res?.success) {
        toast.success(res.message || "Permisos otorgados exitosamente");
        setModalAsignarAbierto(false);
        // Refrescar lista de permisos y auditoría
        const [permRes, auditRes] = await Promise.all([
          listarPermisos(filtroSoloActivos, filtroFechaPermiso),
          listarAuditoria(150),
        ]);
        if (permRes?.success && permRes.data) setPermisos(permRes.data);
        if (auditRes?.success && auditRes.data) setAuditoriaLogs(auditRes.data);
      } else {
        toast.error(res?.message || "Error al otorgar permisos");
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsAssigningPermisos(false);
    }
  };

  const handleAbrirModalRevocar = (permiso: PermisoHorario) => {
    setPermisoParaRevocar(permiso);
    setMotivoRevocacion("");
  };

  const handleConfirmarRevocacion = async () => {
    if (!permisoParaRevocar) return;

    try {
      setIsRevokingPermiso(true);
      const res = await revocarPermiso({
        permisoId: permisoParaRevocar.id,
        motivoRevocacion: motivoRevocacion.trim() || "Revocado por supervisor",
      });

      if (res?.success) {
        toast.success("Permiso revocado exitosamente. La sesión será finalizada de inmediato.");
        setPermisoParaRevocar(null);
        // Refrescar lista
        const [permRes, auditRes] = await Promise.all([
          listarPermisos(filtroSoloActivos, filtroFechaPermiso),
          listarAuditoria(150),
        ]);
        if (permRes?.success && permRes.data) setPermisos(permRes.data);
        if (auditRes?.success && auditRes.data) setAuditoriaLogs(auditRes.data);
      } else {
        toast.error(res?.message || "Error al revocar permiso");
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsRevokingPermiso(false);
    }
  };

  // Filtrado de permisos para la tabla
  const permisosFiltrados = useMemo(() => {
    return permisos.filter((p) => {
      if (filtroSoloActivos && !p.isActive) return false;
      if (filtroFechaPermiso && p.fecha !== filtroFechaPermiso) return false;
      if (busquedaPermiso.trim()) {
        const q = busquedaPermiso.toLowerCase();
        const matchesName = p.fullName.toLowerCase().includes(q);
        const matchesUser = p.username.toLowerCase().includes(q);
        const matchesMotivo = (p.motivo || "").toLowerCase().includes(q);
        if (!matchesName && !matchesUser && !matchesMotivo) return false;
      }
      return true;
    });
  }, [permisos, filtroSoloActivos, filtroFechaPermiso, busquedaPermiso]);

  // Filtrado de usuarios dentro del modal
  const usuariosModalFiltrados = useMemo(() => {
    return usuariosSistema.filter((u) => {
      if (!u.isActive) return false;
      if (busquedaUsuarioModal.trim()) {
        const q = busquedaUsuarioModal.toLowerCase();
        return (
          u.username.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q) ||
          (u.roleName || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [usuariosSistema, busquedaUsuarioModal]);

  return {
    // Permisos de usuario logueado
    canEditHorario,
    canAssignPermiso,
    canRevokePermiso,

    // Estados generales
    activeTab,
    setActiveTab,
    loading: loading || apiLoading,

    // Configuración general
    generalConfig,
    isSavingGeneral,
    handleGuardarConfigGeneral,

    // Horarios semanales
    horariosSemana,
    isSavingSemana,
    handleUpdateDiaHorario,
    handleGuardarHorariosSemana,

    // Festivos
    festivos,
    modalFestivoAbierto,
    setModalFestivoAbierto,
    festivoFecha,
    setFestivoFecha,
    festivoDescripcion,
    setFestivoDescripcion,
    festivoEsLaboral,
    setFestivoEsLaboral,
    isSubmittingFestivo,
    handleGuardarFestivo,
    handleEliminarFestivo,

    // Permisos
    permisosFiltrados,
    filtroSoloActivos,
    setFiltroSoloActivos,
    filtroFechaPermiso,
    setFiltroFechaPermiso,
    busquedaPermiso,
    setBusquedaPermiso,

    // Modal de asignación masiva
    modalAsignarAbierto,
    setModalAsignarAbierto,
    usuariosModalFiltrados,
    selectedUserIds,
    fechaAsignacion,
    setFechaAsignacion,
    horaInicioAsignacion,
    setHoraInicioAsignacion,
    horaFinAsignacion,
    setHoraFinAsignacion,
    motivoAsignacion,
    setMotivoAsignacion,
    busquedaUsuarioModal,
    setBusquedaUsuarioModal,
    isAssigningPermisos,
    handleToggleUserSelection,
    handleSelectAllUsers,
    handleAbrirModalAsignar,
    handleGuardarPermisosMasivo,

    // Modal de revocación
    permisoParaRevocar,
    setPermisoParaRevocar,
    motivoRevocacion,
    setMotivoRevocacion,
    isRevokingPermiso,
    handleAbrirModalRevocar,
    handleConfirmarRevocacion,

    // Auditoría
    auditoriaLogs,
    cargarDatos,
  };
}
