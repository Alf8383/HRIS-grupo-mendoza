import { Home } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <p className="text-6xl font-semibold tracking-tight text-foreground">404</p>
        <p className="text-lg font-semibold text-foreground">Página no encontrada</p>
        <p className="text-sm text-muted-foreground">
          La ruta que intentas acceder no existe o ha sido movida.
        </p>
        <Button asChild>
          <Link to="/app/dashboard">
            <Home />
            Ir al inicio
          </Link>
        </Button>
      </div>
    </div>
  )
}
