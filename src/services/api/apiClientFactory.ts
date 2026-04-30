import axios from "axios";

export interface ApiAuthSession {
  token?: string | null;
  tenantId?: string | null;
}

export interface ApiClientFactoryOptions {
  baseURL: string;
  apiUrl?: string;
  timeout: number;
  authSession?: ApiAuthSession;
}

export function isAbsoluteHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

export function buildApiBaseUrl(baseURL: string, apiUrl = ""): string {
  const candidate = baseURL.trim();
  if (isAbsoluteHttpUrl(candidate)) {
    return candidate;
  }

  const configuredApiUrl = apiUrl.trim();
  if (!configuredApiUrl) {
    return candidate;
  }

  const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, "");
  const normalizedPath = candidate.replace(/^\/+/, "");
  return normalizedPath ? `${normalizedApiUrl}/${normalizedPath}` : normalizedApiUrl;
}

export function buildApiHeaders(
  authSession: ApiAuthSession = {}
): Record<string, string> {
  const token = String(authSession.token ?? "").trim();

  return {
    "Content-Type": "application/json",
    Accept: "*/*",
    "X-Tenant-Id": String(authSession.tenantId ?? ""),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function createApiClient({
  baseURL,
  apiUrl = "",
  timeout,
  authSession,
}: ApiClientFactoryOptions) {
  return axios.create({
    baseURL: buildApiBaseUrl(baseURL, apiUrl),
    timeout,
    headers: buildApiHeaders(authSession),
  });
}
