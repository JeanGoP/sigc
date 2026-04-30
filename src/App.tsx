import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Main from "@modules/main/Main";
import Login from "@modules/login/Login";
import Register from "@modules/register/Register";
import ForgetPassword from "@modules/forgot-password/ForgotPassword";
import RecoverPassword from "@modules/recover-password/RecoverPassword";
import { useBrowserTranslationObserver } from "@app/hooks/useBrowserTranslationObserver";
import { usePageTracking } from "@app/hooks/usePageTracking";
import { useSeguimientoDraftCleanup } from "@app/hooks/useSeguimientoDraftCleanup";
import { useSessionBootstrap } from "@app/hooks/useSessionBootstrap";
import { useWindowSize } from "@app/hooks/useWindowSize";
import { calculateWindowSize } from "@app/utils/helpers";
import { setWindowSize } from "@app/store/reducers/ui";
import Dashboard from "@pages/Dashboard";
import Blank from "@pages/Blank";
import SubMenu from "@pages/SubMenu";
import PublicRoute from "./routes/PublicRoute";
import PrivateRoute from "./routes/PrivateRoute";
import PermissionRoute from "./routes/PermissionRoute";
import { useAppDispatch, useAppSelector } from "./store/store";
import { Loading } from "./components/Loading";
import ConsultaClientes from "@app/pages/ConsultaClientes/ConsultaCLientes";
import { ConsultaCartera } from "@app/pages/ConsultaCartera/ConsultaCartera";
import ParametrosGenerales from "@app/pages/ParametrosGenerales";
import TiposEventos from "@app/modules/maestros/tipos-eventos/TiposEventos";
import Calendario from "@pages/Calendario";
import { RendimientoDeAsesores } from "@app/pages/MonitorGestion/RendimientoDeAsesores";
import TiposGestiones from "./modules/maestros/tipos-gestiones/TiposGestiones";
import EtiquetasClientes from "./modules/maestros/etiquetas-cliente/EtiquetasClientes";
import AsignacionCarterasPage from "@app/modules/asignacion-carteras/AsignacionCarterasPage";
import UsuariosPage from "@app/modules/parametrizacion/usuarios/UsuariosPage";
import RolesPermisosPage from "@app/modules/parametrizacion/roles-permisos/RolesPermisosPage";
import { ModificacionEventos } from "./pages/ModificacionEventos/ModificacionEventos";
import Unauthorized from "./pages/Unauthorized";
import CambiarContrasena from "./pages/CambiarContrasena";

const App = () => {
  const windowSize = useWindowSize();
  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const dispatch = useAppDispatch();
  const isAppLoading = useSessionBootstrap();

  useBrowserTranslationObserver();
  useSeguimientoDraftCleanup();
  usePageTracking();

  useEffect(() => {
    const size = calculateWindowSize(windowSize.width);
    if (screenSize !== size) {
      dispatch(setWindowSize(size));
    }
  }, [windowSize, screenSize, dispatch]);

  if (isAppLoading) {
    return <Loading />;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route path="/register" element={<PublicRoute />}>
          <Route path="/register" element={<Register />} />
        </Route>
        <Route path="/forgot-password" element={<PublicRoute />}>
          <Route path="/forgot-password" element={<ForgetPassword />} />
        </Route>
        <Route path="/recover-password" element={<PublicRoute />}>
          <Route path="/recover-password" element={<RecoverPassword />} />
        </Route>
        <Route path="/" element={<PrivateRoute />}>
          <Route path="/" element={<Main />}>
            <Route path="/sub-menu-2" element={<Blank />} />
            <Route path="/sub-menu-1" element={<SubMenu />} />
            <Route path="/blank" element={<Blank />} />
            <Route
              path="/consulta_clientes"
              element={
                <PermissionRoute permission="consulta_clientes.view">
                  <ConsultaClientes />
                </PermissionRoute>
              }
            />
            <Route
              path="/consulta_carteras"
              element={
                <PermissionRoute permission="consulta_carteras.view">
                  <ConsultaCartera />
                </PermissionRoute>
              }
            />
            <Route
              path="/modificacion_gestiones"
              element={
                <PermissionRoute permission="modificacion_gestiones.view">
                  <ModificacionEventos />
                </PermissionRoute>
              }
            />
            <Route path="/profile" element={<Dashboard />} />
            <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />
            <Route
              path="/parametros_generales"
              element={
                <PermissionRoute permission="parametros_generales.view">
                  <ParametrosGenerales />
                </PermissionRoute>
              }
            />
            <Route
              path="/parametrizacion/usuarios"
              element={
                <PermissionRoute permission="usuarios.view">
                  <UsuariosPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/parametrizacion/roles-permisos"
              element={
                <PermissionRoute permission="roles_permisos.view">
                  <RolesPermisosPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/tipos_eventos"
              element={
                <PermissionRoute permission="tipos_eventos.view">
                  <TiposEventos />
                </PermissionRoute>
              }
            />
            <Route
              path="/tipos_gestiones"
              element={
                <PermissionRoute permission="tipos_gestiones.view">
                  <TiposGestiones />
                </PermissionRoute>
              }
            />
            <Route
              path="/etiquetas_clientes"
              element={
                <PermissionRoute permission="etiquetas_clientes.view">
                  <EtiquetasClientes />
                </PermissionRoute>
              }
            />
            <Route
              path="/monitor_seguimientos"
              element={<Navigate to="/profile" replace />}
            />
            <Route
              path="/rendimiento_asesores"
              element={
                <PermissionRoute permission="rendimiento_asesores.view">
                  <RendimientoDeAsesores />
                </PermissionRoute>
              }
            />
            <Route
              path="/asignacion_carteras"
              element={
                <PermissionRoute permission="asignacion_carteras.view">
                  <AsignacionCarterasPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/calendario"
              element={
                <PermissionRoute permission="calendario.view">
                  <Calendario />
                </PermissionRoute>
              }
            />
            <Route path="/campanas" element={<Navigate to="/profile" replace />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route
              index
              element={
                <PermissionRoute permission="dashboard.view">
                  <Dashboard />
                </PermissionRoute>
              }
            />
          </Route>
        </Route>
      </Routes>
      <ToastContainer
        autoClose={3000}
        draggable={false}
        position="top-right"
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnHover
      />
      <ToastContainer
        containerId="eventos-container"
        autoClose={10000}
        draggable={false}
        position="top-center"
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnHover
      />
    </>
  );
};

export default App;
