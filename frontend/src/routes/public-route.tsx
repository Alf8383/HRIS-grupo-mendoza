import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/contexts/auth-context'

export function PublicRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-6">
        <p className="text-sm text-muted-foreground">Cargando acceso...</p>
      </div>
    )
  }

  if (status === 'authenticated') {
    return <Navigate replace to="/app/dashboard" />
  }

  return <Outlet />
}
