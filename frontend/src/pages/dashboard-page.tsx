import {
  Building2,
  CalendarClock,
  ClipboardList,
  ChevronRight,
  Network,
  Users,
  BriefcaseBusiness,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { StatusBadge } from '@/components/app/status-badge'
import { useAuth } from '@/contexts/auth-context'
import { getRoleLabel } from '@/lib/roles'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  { title: 'Empleados', to: '/app/employees', icon: Users, countLabel: 'Ver listado' },
  { title: 'Cargos', to: '/app/settings/cargos', icon: BriefcaseBusiness, countLabel: 'Ver catálogo' },
  { title: 'Sedes', to: '/app/settings/sedes', icon: Network, countLabel: 'Ver ubicaciones' },
  { title: 'Asistencia', to: '/app/attendance', icon: CalendarClock, countLabel: 'Registrar' },
  { title: 'Permisos', to: '/app/leave-requests', icon: ClipboardList, countLabel: 'Solicitar' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const user = session?.user

  const userInitials = user?.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card className="rounded-3xl border-none bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90 text-white shadow-xl dark:from-slate-950 dark:via-slate-900 dark:to-primary/80">
          <CardHeader className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit bg-white/12 text-white">
              Panel principal
            </Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight text-balance">
              Bienvenido, {user?.name}
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
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/8 p-4 text-left backdrop-blur transition-all duration-200 ease-out hover:bg-white/12 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 transition-transform duration-200 group-hover:scale-105">
                    <item.icon className="size-4 text-white/90" />
                  </div>
                  <ChevronRight className="size-4 text-white/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white/70" />
                </div>
                <p className="mt-3 text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-slate-300">{item.countLabel}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Tu cuenta</CardTitle>
            <CardDescription>Información general de acceso.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Avatar className="size-12 border">
                <AvatarFallback className="text-sm font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Estado</span>
              {user?.status ? <StatusBadge value={user.status} /> : null}
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Roles</span>
              <div className="flex flex-wrap gap-2">
                {user?.roles.map((role) => (
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
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="size-5 text-primary" />
                </div>
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
                className="group flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ease-out hover:bg-muted/50 hover:shadow-sm"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-200 group-hover:scale-105">
                  <item.icon className="size-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{item.title}</span>
                <ChevronRight className="ml-auto size-3.5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
              </button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
