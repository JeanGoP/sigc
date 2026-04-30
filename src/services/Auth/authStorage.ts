import { User } from "../../models/auth/User.model";

export const AUTH_STORAGE_KEY = "userAccess";

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

export interface StoredAuthSession {
  token: string;
  tenantId: string;
  userAccess: unknown | null;
}

export interface StoredUserAccess {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  token?: string;
  tenantId?: string;
  mustChangePassword: boolean;
  telephonyEnabled: boolean;
}

export interface AuthUserLike {
  id?: unknown;
  username?: unknown;
  fullName?: unknown;
  email?: unknown;
  role?: unknown;
  token?: unknown;
  tenantId?: unknown;
  mustChangePassword?: unknown;
  telephonyEnabled?: unknown;
}

export interface TokenUserPayloadLike {
  userId: number | string;
  username: string;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
  token?: string | null;
  tenantId?: string | null;
  mustChangePassword?: boolean;
  telephonyEnabled?: boolean;
}

export interface SessionUserDataLike {
  userId?: unknown;
  username?: unknown;
  fullName?: unknown;
  email?: unknown;
  role?: unknown;
  tenantId?: unknown;
  mustChangePassword?: unknown;
  telephonyEnabled?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readStringOrFallback(value: unknown, fallback = ""): string {
  return readString(value) || fallback;
}

export function parseStoredUserAccess(raw: string | null): unknown | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function resolveAuthTokenFromUserAccess(userAccess: unknown): string {
  if (!isRecord(userAccess)) {
    return "";
  }

  const directToken = readString(userAccess.token);
  if (directToken) {
    return directToken;
  }

  const nestedToken = userAccess.token;
  if (isRecord(nestedToken)) {
    const tokenValue = readString(nestedToken.token);
    if (tokenValue) {
      return tokenValue;
    }
  }

  const data = userAccess.data;
  if (isRecord(data)) {
    const dataToken = data.token;
    if (typeof dataToken === "string") {
      return dataToken;
    }

    if (isRecord(dataToken)) {
      return readString(dataToken.token);
    }
  }

  return "";
}

export function resolveTenantIdFromUserAccess(userAccess: unknown): string {
  if (!isRecord(userAccess)) {
    return "";
  }

  const directTenantId = readString(userAccess.tenantId);
  if (directTenantId) {
    return directTenantId;
  }

  const nestedToken = userAccess.token;
  if (isRecord(nestedToken)) {
    const tokenTenantId = readString(nestedToken.tenantId);
    if (tokenTenantId) {
      return tokenTenantId;
    }
  }

  const data = userAccess.data;
  if (isRecord(data)) {
    const dataToken = data.token;
    if (isRecord(dataToken)) {
      const dataTokenTenantId = readString(dataToken.tenantId);
      if (dataTokenTenantId) {
        return dataTokenTenantId;
      }
    }

    return readString(data.tenantId);
  }

  return "";
}

export function isValidStoredUserAccess(userAccess: unknown): userAccess is AuthUserLike {
  return isRecord(userAccess) && Boolean(userAccess.id) && Boolean(userAccess.username);
}

export function buildUserFromUserAccess(userAccess: unknown): User | null {
  if (!isValidStoredUserAccess(userAccess)) {
    return null;
  }

  const username = String(userAccess.username);

  return new User(
    String(userAccess.id),
    username,
    "",
    readString(userAccess.fullName),
    readStringOrFallback(userAccess.email, username),
    readString(userAccess.role),
    resolveAuthTokenFromUserAccess(userAccess),
    resolveTenantIdFromUserAccess(userAccess),
    Boolean(userAccess.mustChangePassword),
    Boolean(userAccess.telephonyEnabled)
  );
}

export function buildUserFromTokenPayload(payload: TokenUserPayloadLike): User {
  return new User(
    String(payload.userId),
    payload.username,
    "",
    payload.fullName || "",
    payload.email || payload.username,
    payload.role || "",
    payload.token || "",
    payload.tenantId || "",
    Boolean(payload.mustChangePassword),
    Boolean(payload.telephonyEnabled)
  );
}

export function buildUserFromSessionData(
  sessionData: SessionUserDataLike,
  currentUser?: AuthUserLike
): User | null {
  if (!sessionData.userId || !sessionData.username) {
    return null;
  }

  const username = String(sessionData.username);

  return new User(
    String(sessionData.userId),
    username,
    "",
    readStringOrFallback(sessionData.fullName, readString(currentUser?.fullName)),
    readStringOrFallback(sessionData.email, readString(currentUser?.email) || username),
    readStringOrFallback(sessionData.role, readString(currentUser?.role)),
    resolveAuthTokenFromUserAccess(currentUser),
    readStringOrFallback(sessionData.tenantId, resolveTenantIdFromUserAccess(currentUser)),
    Boolean(sessionData.mustChangePassword),
    Boolean(sessionData.telephonyEnabled ?? currentUser?.telephonyEnabled)
  );
}

export function buildUserFromSecurityData(
  securityData: SessionUserDataLike,
  previousUserAccess: unknown
): User | null {
  if (!securityData.userId || !securityData.username) {
    return null;
  }

  const previousRole = isRecord(previousUserAccess) ? readString(previousUserAccess.role) : "";
  const username = String(securityData.username);

  return new User(
    String(securityData.userId),
    username,
    "",
    readString(securityData.fullName),
    readStringOrFallback(securityData.email, username),
    readStringOrFallback(securityData.role, previousRole),
    resolveAuthTokenFromUserAccess(previousUserAccess),
    readStringOrFallback(securityData.tenantId, resolveTenantIdFromUserAccess(previousUserAccess)),
    Boolean(securityData.mustChangePassword),
    Boolean(securityData.telephonyEnabled)
  );
}

export function buildStoredUserAccess(user: User): StoredUserAccess {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    token: user.token,
    tenantId: user.tenantId,
    mustChangePassword: user.mustChangePassword,
    telephonyEnabled: user.telephonyEnabled,
  };
}

export function saveStoredUserAccess(
  user: User,
  storage: StorageWriter | null =
    typeof localStorage === "undefined" ? null : localStorage
): void {
  storage?.setItem(AUTH_STORAGE_KEY, JSON.stringify(buildStoredUserAccess(user)));
}

export function resolveStoredAuthSession(
  storage: StorageReader | null =
    typeof localStorage === "undefined" ? null : localStorage
): StoredAuthSession {
  let userAccess: unknown | null = null;

  try {
    userAccess = parseStoredUserAccess(storage?.getItem(AUTH_STORAGE_KEY) ?? null);
  } catch {
    userAccess = null;
  }

  return {
    token: resolveAuthTokenFromUserAccess(userAccess),
    tenantId: resolveTenantIdFromUserAccess(userAccess),
    userAccess,
  };
}
