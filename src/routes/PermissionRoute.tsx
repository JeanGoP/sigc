import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loading } from "../components/Loading";
import { useAppSelector } from "../store/store";
import { can } from "../utils/security";

interface PermissionRouteProps {
  permission: string;
  children: ReactNode;
}

const PermissionRoute = ({ permission, children }: PermissionRouteProps) => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const securityLoaded = useAppSelector((state) => state.security.loaded);
  const permissions = useAppSelector((state) => state.security.permissions);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!securityLoaded) {
    return <Loading />;
  }

  if (!can(permissions, permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default PermissionRoute;
