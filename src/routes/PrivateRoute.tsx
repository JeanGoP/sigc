import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@app/store/store';

const PrivateRoute = () => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to={`/login`} />;
  }

  const mustChangePassword = Boolean((currentUser as any).mustChangePassword);
  if (mustChangePassword && location.pathname !== '/cambiar-contrasena') {
    return <Navigate to={`/cambiar-contrasena`} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
