import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/contexts/auth-context'

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-6">
        <div className="flex max-w-sm flex-col gap-2 text-center">
          <p className="text-sm font-medium text-foreground">
            Inicializando sesión
          </p>
          <p className="text-sm text-muted-foreground">
            Estamos validando tu acceso al sistema.
          </p>
        </div>
      </div>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet />
}
