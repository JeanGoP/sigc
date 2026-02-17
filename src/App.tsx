import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ReactGA from "react-ga4";
import Main from "@modules/main/Main";
import Login from "@modules/login/Login";
import Register from "@modules/register/Register";
import ForgetPassword from "@modules/forgot-password/ForgotPassword";
import RecoverPassword from "@modules/recover-password/RecoverPassword";
import { useWindowSize } from "@app/hooks/useWindowSize";
import { calculateWindowSize } from "@app/utils/helpers";
import { setWindowSize } from "@app/store/reducers/ui";
import Dashboard from "@pages/Dashboard";
import Blank from "@pages/Blank";
import SubMenu from "@pages/SubMenu";
import PublicRoute from "./routes/PublicRoute";
import PrivateRoute from "./routes/PrivateRoute";
import PermissionRoute from "./routes/PermissionRoute";
import { setCurrentUser } from "./store/reducers/auth";
import { clearSecurity, setSecurityData } from "./store/reducers/security";
import { useAppDispatch, useAppSelector } from "./store/store";
import { Loading } from "./components/Loading";
import { User } from "./models/auth/User.model";
import ConsultaClientes from "@app/pages/ConsultaClientes/ConsultaCLientes";
import { ConsultaCartera } from "@app/pages/ConsultaCartera/ConsultaCartera";
import ParametrosGenerales from "@app/pages/ParametrosGenerales";
import TiposEventos from "@app/modules/maestros/tipos-eventos/TiposEventos";
import MonitorSeguimientos from "@pages/MonitorSeguimientos";
import Calendario from "@pages/Calendario";
import { RendimientoDeAsesores } from "@app/pages/MonitorGestion/RendimientoDeAsesores";
import Campaigns from "./pages/Campaigns/Campaigns";
import TiposGestiones from "./modules/maestros/tipos-gestiones/TiposGestiones";
import EtiquetasClientes from "./modules/maestros/etiquetas-cliente/EtiquetasClientes";
import AsignacionCarterasPage from "@app/modules/asignacion-carteras/AsignacionCarterasPage";
import UsuariosPage from "@app/modules/parametrizacion/usuarios/UsuariosPage";
import RolesPermisosPage from "@app/modules/parametrizacion/roles-permisos/RolesPermisosPage";
import { useSessionService } from "@app/services/Auth/ValidateToken";
import { useSecurityService } from "@app/services/Security/securityService";
import { ModificacionEventos } from "./pages/ModificacionEventos/ModificacionEventos";
import Unauthorized from "./pages/Unauthorized";
import CambiarContrasena from "./pages/CambiarContrasena";

const { VITE_NODE_ENV } = import.meta.env;

const App = () => {
  const windowSize = useWindowSize();
  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { validateToken } = useSessionService();
  const { getSecurityMe } = useSecurityService();
  const [isAppLoading, setIsAppLoading] = useState(true);

  const TARGETS = [
    "/login",
    "/register",
    "/forgot-password",
    "/recover-password",
  ];

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      const hasLargeTextMutation = mutations.some((item) => item.type === "characterData");
      if (hasLargeTextMutation) {
        // Reserved for browser-translation warnings if needed.
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const currentPath = location.pathname;
        if (TARGETS.includes(currentPath)) {
          dispatch(clearSecurity());
          return;
        }

        const userData = localStorage.getItem("userAccess");
        if (!userData) {
          dispatch(setCurrentUser(null));
          dispatch(clearSecurity());
          toast.info("No tienes una sesion activa, por favor inicia sesion.");
          return;
        }

        let parsedData: any = null;
        try {
          parsedData = JSON.parse(userData);
        } catch {
          parsedData = null;
        }

        if (
          !parsedData ||
          typeof parsedData !== "object" ||
          !parsedData.id ||
          !parsedData.username
        ) {
          localStorage.removeItem("userAccess");
          dispatch(setCurrentUser(null));
          dispatch(clearSecurity());
          return;
        }

        const tokenValidation = await validateToken({
          id: parsedData.id,
          username: parsedData.username,
          fullName: parsedData.fullName,
          email: parsedData.email,
          role: parsedData.role,
          token: parsedData.token ?? "",
          mustChangePassword: Boolean(parsedData.mustChangePassword),
        });

        if (tokenValidation.valid && tokenValidation.user) {
          dispatch(setCurrentUser(tokenValidation.user));
        } else {
          const fallbackUser = new User(
            parsedData.id,
            parsedData.username,
            "",
            parsedData.fullName || "",
            parsedData.email || parsedData.username,
            parsedData.role,
            parsedData.token ?? "",
            parsedData.tenantId ?? "",
            Boolean(parsedData.mustChangePassword)
          );
          dispatch(setCurrentUser(fallbackUser));
        }

        const securityResponse = await getSecurityMe();
        if (securityResponse?.success && securityResponse.data) {
          const mustChangePassword = Boolean(securityResponse.data.mustChangePassword);
          dispatch(
            setSecurityData({
              menuTree: mustChangePassword ? [] : securityResponse.data.menuTree ?? [],
              permissions: mustChangePassword ? [] : securityResponse.data.permissions ?? [],
            })
          );

          const refreshedUser = new User(
            securityResponse.data.userId.toString(),
            securityResponse.data.username,
            "",
            securityResponse.data.fullName || "",
            securityResponse.data.email || securityResponse.data.username,
            securityResponse.data.role || parsedData.role,
            parsedData.token ?? "",
            securityResponse.data.tenantId || parsedData.tenantId || "",
            mustChangePassword
          );

          dispatch(setCurrentUser(refreshedUser));
          localStorage.setItem(
            "userAccess",
            JSON.stringify({
              id: refreshedUser.id,
              username: refreshedUser.username,
              fullName: refreshedUser.fullName,
              email: refreshedUser.email,
              role: refreshedUser.role,
              token: refreshedUser.token,
              tenantId: refreshedUser.tenantId,
              mustChangePassword: refreshedUser.mustChangePassword,
            })
          );
        } else {
          dispatch(
            setSecurityData({
              menuTree: [],
              permissions: [],
            })
          );
        }
      } catch (error) {
        console.error("Error validando sesion:", error);
        localStorage.removeItem("userAccess");
        dispatch(setCurrentUser(null));
        dispatch(clearSecurity());
      } finally {
        setIsAppLoading(false);
      }
    };

    checkUserSession();
  }, [dispatch, validateToken, getSecurityMe, location.pathname]);

  useEffect(() => {
    const size = calculateWindowSize(windowSize.width);
    if (screenSize !== size) {
      dispatch(setWindowSize(size));
    }
  }, [windowSize, screenSize, dispatch]);

  useEffect(() => {
    if (location.pathname && VITE_NODE_ENV === "production") {
      ReactGA.send({
        hitType: "pageview",
        page: location.pathname,
      });
    }
  }, [location]);

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
              path="/modificacion_eventos"
              element={
                <PermissionRoute permission="modificacion_eventos.view">
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
            <Route path="/monitor_seguimientos" element={<MonitorSeguimientos />} />
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
            <Route
              path="/campanas"
              element={
                <PermissionRoute permission="campanas.view">
                  <Campaigns />
                </PermissionRoute>
              }
            />
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
    </>
  );
};

export default App;
