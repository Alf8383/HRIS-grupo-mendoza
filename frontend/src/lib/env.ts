export const appEnv = {
  appName: import.meta.env.VITE_APP_NAME ?? 'RRHH Grupo Mendoza',
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ??
    'http://localhost:8080/api/v1',
}
