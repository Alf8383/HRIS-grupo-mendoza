export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  HR: 'Recursos Humanos',
  MANAGER: 'Jefe de área',
  EMPLOYEE: 'Empleado',
}

export function getRoleLabel(role: string) {
  return ROLE_LABELS[role] ?? role
}

export function hasSomeRole(userRoles: string[] | undefined, allowedRoles: string[]) {
  if (!userRoles?.length) {
    return false
  }

  return allowedRoles.some((role) => userRoles.includes(role))
}
