export function getConfiguredApiUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? "";
}
