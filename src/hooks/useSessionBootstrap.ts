import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppDispatch } from "../store/store";
import { setCurrentUser } from "../store/reducers/auth";
import { clearSecurity, setSecurityData } from "../store/reducers/security";
import { useSessionService } from "../services/Auth/ValidateToken";
import {
  AUTH_STORAGE_KEY,
  buildUserFromSecurityData,
  buildUserFromUserAccess,
  parseStoredUserAccess,
  saveStoredUserAccess,
} from "../services/Auth/authStorage";
import { useSecurityService } from "../services/Security/securityService";

const PUBLIC_SESSION_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/recover-password",
];

export function useSessionBootstrap(): boolean {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { validateToken } = useSessionService();
  const { getSecurityMe } = useSecurityService();
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const currentPath = location.pathname;
        if (PUBLIC_SESSION_PATHS.includes(currentPath)) {
          dispatch(clearSecurity());
          return;
        }

        const userData = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!userData) {
          dispatch(setCurrentUser(null));
          dispatch(clearSecurity());
          toast.info("No tienes una sesion activa, por favor inicia sesion.");
          return;
        }

        const parsedData = parseStoredUserAccess(userData);
        const storedUser = buildUserFromUserAccess(parsedData);

        if (!storedUser) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          dispatch(setCurrentUser(null));
          dispatch(clearSecurity());
          return;
        }

        const tokenValidation = await validateToken(storedUser);

        if (tokenValidation.valid && tokenValidation.user) {
          dispatch(setCurrentUser(tokenValidation.user));
        } else {
          dispatch(setCurrentUser(storedUser));
        }

        const securityResponse = await getSecurityMe();
        if (securityResponse?.success && securityResponse.data) {
          const mustChangePassword = Boolean(securityResponse.data.mustChangePassword);
          dispatch(
            setSecurityData({
              menuTree: mustChangePassword ? [] : securityResponse.data.menuTree ?? [],
              permissions: mustChangePassword ? [] : securityResponse.data.permissions ?? [],
              reportesPermitidos: mustChangePassword ? [] : securityResponse.data.reportesPermitidos ?? [],
            })
          );

          const refreshedUser = buildUserFromSecurityData(securityResponse.data, parsedData);
          if (!refreshedUser) {
            dispatch(setCurrentUser(storedUser));
            return;
          }

          dispatch(setCurrentUser(refreshedUser));
          saveStoredUserAccess(refreshedUser);
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
        localStorage.removeItem(AUTH_STORAGE_KEY);
        dispatch(setCurrentUser(null));
        dispatch(clearSecurity());
      } finally {
        setIsAppLoading(false);
      }
    };

    void checkUserSession();
  }, [dispatch, getSecurityMe, location.pathname, validateToken]);

  return isAppLoading;
}
