import {
  Building2,
  CalendarClock,
  ClipboardList,
  Network,
  Users,
  BriefcaseBusiness,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { StatusBadge } from '@/components/app/status-badge'
import { useAuth } from '@/contexts/auth-context'
import { getRoleLabel } from '@/lib/roles'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const quickLinks = [
  { title: 'Empleados', to: '/app/employees', icon: Users },
  { title: 'Cargos', to: '/app/settings/cargos', icon: BriefcaseBusiness },
  { title: 'Sedes', to: '/app/settings/sedes', icon: Network },
  { title: 'Asistencia', to: '/app/attendance', icon: CalendarClock },
  { title: 'Permisos', to: '/app/leave-requests', icon: ClipboardList },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { session } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card className="rounded-3xl border-none bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90 text-white shadow-xl dark:from-slate-950 dark:via-slate-900 dark:to-primary/80">
          <CardHeader className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit bg-white/12 text-white">
              Panel principal
            </Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight text-balance">
              Bienvenido, {session?.user.name}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-7 text-slate-200">
              Accede a los módulos del sistema y mantén centralizada la gestión
              de la información del personal.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {quickLinks.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(item.to)}
                className="rounded-2xl border border-white/10 bg-white/8 p-4 text-left backdrop-blur transition-colors hover:bg-white/12"
              >
                <item.icon className="size-5 text-white/85" />
                <p className="mt-4 text-sm font-semibold">{item.title}</p>
                <p className="mt-2 text-sm text-slate-200">
                  Ir al módulo de {item.title.toLowerCase()}.
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Tu cuenta</CardTitle>
            <CardDescription>Información general de acceso.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Correo</span>
              <span className="text-sm font-medium">{session?.user.email}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Estado</span>
              {session?.user.status ? <StatusBadge value={session.user.status} /> : null}
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Roles</span>
              <div className="flex flex-wrap gap-2">
                {session?.user.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {getRoleLabel(role)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Operación diaria</CardTitle>
            <CardDescription>
              Acciones frecuentes dentro del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <Building2 className="size-5 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">Estructura lista para operar</p>
                  <p className="text-sm text-muted-foreground">
                    Usuarios, empleados y estructura organizacional desde un solo panel.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              Usa el menú lateral para moverte entre las secciones habilitadas
              según tu rol. Recuerda registrar tu asistencia diaria y gestionar
              tus solicitudes de permisos desde los módulos correspondientes.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Enlaces rápidos</CardTitle>
            <CardDescription>
              Navega directamente a los módulos principales.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(item.to)}
                className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50"
              >
                <item.icon className="size-4 text-primary" />
                <span className="text-sm font-medium">{item.title}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
