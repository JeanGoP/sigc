import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Main from '@modules/main/Main';
import Login from '@modules/login/Login';
import Register from '@modules/register/Register';
import ForgetPassword from '@modules/forgot-password/ForgotPassword';
import RecoverPassword from '@modules/recover-password/RecoverPassword';
import { useWindowSize } from '@app/hooks/useWindowSize';
import { calculateWindowSize } from '@app/utils/helpers';
import { setWindowSize } from '@app/store/reducers/ui';
import ReactGA from 'react-ga4';

import Dashboard from '@pages/Dashboard';
import Blank from '@pages/Blank';
import SubMenu from '@pages/SubMenu';
// import Profile from '@pages/profile/Profile';

import PublicRoute from './routes/PublicRoute';
import PrivateRoute from './routes/PrivateRoute';
import { setCurrentUser } from './store/reducers/auth';
import {users } from './Data/users_example';

// import { firebaseAuth } from './firebase';
// import { onAuthStateChanged } from 'firebase/auth';
import { useAppDispatch, useAppSelector } from './store/store';
import { Loading } from './components/Loading';
import { User } from './models/auth/User.model';
import ConsultaClientes from '@app/pages/ConsultaClientes/ConsultaCLientes';
import {ConsultaCartera} from '@app/pages/ConsultaCartera/ConsultaCartera';
import ParametrosGenerales from '@app/pages/ParametrosGenerales';
import TiposEventos from '@app/modules/maestros/tipos-eventos/TiposEventos';
import MonitorSeguimientos from '@pages/MonitorSeguimientos';
import Calendario from '@pages/Calendario';
import { RendimientoDeAsesores } from '@app/pages/MonitorGestion/RendimientoDeAsesores';
import Campaigns from './pages/Campaigns/Campaigns';
import TiposGestiones from './modules/maestros/tipos-gestiones/TiposGestiones';
import EtiquetasClientes from './modules/maestros/etiquetas-cliente/EtiquetasClientes';

const { VITE_NODE_ENV } = import.meta.env;

const App = () => {
  const windowSize = useWindowSize();
  const screenSize = useAppSelector((state) => state.ui.screenSize);
  const dispatch = useAppDispatch();
  const location = useLocation();

  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const userData = localStorage?.getItem('userAccess');

        if (!userData) {
          dispatch(setCurrentUser(null));
          return;
        }

        const parsedData = JSON.parse(userData);
        
        // Crear instancia de User
        const userNew = new User(
          parsedData.id,
          parsedData.username,
          '', // No necesitamos el password
          parsedData.email,
          parsedData.role,
          parsedData.token // Incluimos el token
        );

        // Validar el token con el backend
        const response = await fetch('https://localhost:7013/api/Auth/validate-token', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userNew.token}`
          }
        });

        if (response.ok) {
          dispatch(setCurrentUser(userNew));
        } else {
          // Si el token no es válido, limpiar el localStorage
          localStorage.removeItem('userAccess');
          dispatch(setCurrentUser(null));
        }
      } catch (error) {
        console.error('Error validando sesión:', error);
        localStorage.removeItem('userAccess');
        dispatch(setCurrentUser(null));
      } finally {
        setIsAppLoading(false);
      }
    };
  
    checkUserSession();
  }, []);
  
  
async function fetchUserFromToken(token: User) {
  // Simulamos que el token es simplemente el ID del usuario
  const usr = token; 

  const user = users.find(u => u.email === usr.email && u.password === usr.password);

  if (!user) {
    throw new Error('Token inválido');
  }

  return user;
}

  useEffect(() => {
    const size = calculateWindowSize(windowSize.width);
    if (screenSize !== size) {
      dispatch(setWindowSize(size));
    }
  }, [windowSize]);

  useEffect(() => {
    if (location && location.pathname && VITE_NODE_ENV === 'production') {
      ReactGA.send({
        hitType: 'pageview',
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
            <Route path="/consulta_clientes" element={<ConsultaClientes />} />
            <Route path="/consulta_carteras" element={<ConsultaCartera />} />
            {/* <Route path="/profile" element={<Profile />} /> */}
            <Route path="/profile" element={<Dashboard />} />
            <Route path="/parametros_generales" element={<ParametrosGenerales />} />
            <Route path="/tipos_eventos" element={<TiposEventos />} />
            <Route path="/tipos_gestiones" element={<TiposGestiones />} />
            <Route path="/etiquetas_clientes" element={<EtiquetasClientes />} />
            <Route path="/monitor_seguimientos" element={<MonitorSeguimientos />} />
            <Route path="/rendimiento_asesores" element={<RendimientoDeAsesores />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/campanas" element={<Campaigns />} />
            <Route path="/" element={<Dashboard />} />
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
