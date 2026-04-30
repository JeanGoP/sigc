export interface RuntimeEnvironment {
  DEV?: boolean;
  MODE?: string;
  VITE_NODE_ENV?: string;
}

const normalizeEnvironmentValue = (value: string | undefined): string => {
  return value?.trim().toLowerCase() ?? "";
};

export const shouldEnableReduxLogger = (env: RuntimeEnvironment): boolean => {
  const explicitNodeEnv = normalizeEnvironmentValue(env.VITE_NODE_ENV);

  if (explicitNodeEnv) {
    return explicitNodeEnv === "development";
  }

  const viteMode = normalizeEnvironmentValue(env.MODE);

  if (viteMode) {
    return viteMode === "development";
  }

  return env.DEV === true;
};
