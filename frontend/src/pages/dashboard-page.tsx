import { useEffect, useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileBadge2,
  FileSpreadsheet,
  History,
  Network,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/app/status-badge'
import { useAuth } from '@/contexts/auth-context'
import { formatDate } from '@/lib/format'
import { apiRequest, getApiMessage } from '@/lib/http'
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
import type {
  ExpiringContractItem,
  VacationBalance,
  VacationRequestRecord,
} from '@/types/domain'

export function DashboardPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const token = session?.token ?? ''
  const user = session?.user
  const roles = useMemo(() => user?.roles ?? [], [user?.roles])

  const showEmployeeModules = roles.some((role) => ['ADMIN', 'HR'].includes(role))
  const showOwnVacation = roles.some((role) => ['EMPLOYEE', 'MANAGER'].includes(role))
  const showPendingVacations = roles.some((role) => ['ADMIN', 'HR', 'MANAGER'].includes(role))
  const showExpiringContracts = roles.some((role) => ['ADMIN', 'HR'].includes(role))
  const showReports = roles.some((role) => ['ADMIN', 'HR', 'MANAGER'].includes(role))
  const showAudit = roles.some((role) => ['ADMIN', 'HR'].includes(role))

  const [ownBalance, setOwnBalance] = useState<VacationBalance | null>(null)
  const [pendingRequests, setPendingRequests] = useState<VacationRequestRecord[]>([])
  const [expiringContracts, setExpiringContracts] = useState<ExpiringContractItem[]>([])

  useEffect(() => {
    if (!token) return

    const loadDashboard = async () => {
      try {
        const tasks: Promise<void>[] = []

        if (showOwnVacation) {
          tasks.push(
            apiRequest<VacationBalance>('/vacations/balance/me', { token }).then(
              setOwnBalance,
            ),
          )
        }

        if (roles.includes('MANAGER')) {
          tasks.push(
            apiRequest<VacationRequestRecord[]>(
              '/vacations/requests/team?status=PENDING',
              { token },
            ).then(setPendingRequests),
          )
        } else if (roles.some((role) => ['ADMIN', 'HR'].includes(role))) {
          tasks.push(
            apiRequest<VacationRequestRecord[]>(
              '/vacations/requests/all?status=PENDING',
              { token },
            ).then(setPendingRequests),
          )
        }

        if (showExpiringContracts) {
          tasks.push(
            apiRequest<ExpiringContractItem[]>('/contracts/expiring', {
              token,
            }).then(setExpiringContracts),
          )
        }

        await Promise.all(tasks)
      } catch (error) {
        toast.error(getApiMessage(error, 'No se pudo cargar el resumen del dashboard.'))
      }
    }

    void loadDashboard()
  }, [roles, showExpiringContracts, showOwnVacation, token])

  const quickLinks = useMemo(
    () =>
      [
        {
          title: 'Asistencia',
          to: '/app/attendance',
          icon: CalendarClock,
          helper: 'Control diario',
          visible: true,
        },
        {
          title: 'Permisos',
          to: '/app/leave-requests',
          icon: ClipboardList,
          helper: 'Solicitudes',
          visible: true,
        },
        {
          title: 'Vacaciones',
          to: '/app/vacations',
          icon: CalendarDays,
          helper: 'Saldos y aprobaciones',
          visible: true,
        },
        {
          title: 'Reportes',
          to: '/app/reports',
          icon: FileSpreadsheet,
          helper: 'Consultas y exportación',
          visible: showReports,
        },
        {
          title: 'Bitácora',
          to: '/app/audit',
          icon: History,
          helper: 'Trazabilidad',
          visible: showAudit,
        },
        {
          title: 'Empleados',
          to: '/app/employees',
          icon: Users,
          helper: 'Base de personal',
          visible: showEmployeeModules,
        },
        {
          title: 'Cargos',
          to: '/app/settings/cargos',
          icon: BriefcaseBusiness,
          helper: 'Estructura',
          visible: showEmployeeModules,
        },
        {
          title: 'Sedes',
          to: '/app/settings/sedes',
          icon: Network,
          helper: 'Ubicaciones',
          visible: showEmployeeModules,
        },
        {
          title: 'Contratos',
          to: '/app/contracts',
          icon: FileBadge2,
          helper: 'Vigencias',
          visible: showExpiringContracts,
        },
      ].filter((item) => item.visible),
    [showAudit, showEmployeeModules, showExpiringContracts, showReports],
  )

  const userInitials = user?.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="rounded-3xl border-none bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90 text-white shadow-xl dark:from-slate-950 dark:via-slate-900 dark:to-primary/80">
          <CardHeader className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit bg-white/12 text-white">
              Panel principal
            </Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight text-balance">
              Bienvenido, {user?.name}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-7 text-slate-200">
              Accede a los módulos habilitados y revisa el estado más importante
              de tu operación diaria.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {quickLinks.slice(0, 6).map((item) => (
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
                <p className="mt-1 text-xs text-slate-300">{item.helper}</p>
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

      <section className="grid gap-4 lg:grid-cols-3">
        {showOwnVacation ? (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Mi saldo de vacaciones</CardTitle>
              <CardDescription>Resumen rápido de disponibilidad actual.</CardDescription>
            </CardHeader>
            <CardContent>
              {ownBalance ? (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <MetricBlock label="Disponibles" value={ownBalance.availableDays} />
                  <MetricBlock label="Usados" value={ownBalance.usedDays} />
                  <MetricBlock label="Pendientes" value={ownBalance.pendingDays} />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                  Tu saldo aún no está cargado. Si necesitas operar vacaciones, RR. HH. puede registrar el saldo inicial desde el módulo correspondiente.
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {showPendingVacations ? (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Vacaciones pendientes</CardTitle>
              <CardDescription>
                {roles.includes('MANAGER')
                  ? 'Solicitudes del equipo pendientes de revisión.'
                  : 'Solicitudes pendientes para seguimiento operativo.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetricBlock label="Pendientes" value={pendingRequests.length} />
              {pendingRequests.slice(0, 3).map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => navigate('/app/vacations')}
                  className="flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-medium">{request.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </p>
                  </div>
                  <StatusBadge value={request.status} />
                </button>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {showExpiringContracts ? (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Contratos por vencer</CardTitle>
              <CardDescription>Alertas visibles para los próximos 30 días.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetricBlock label="Alertas" value={expiringContracts.length} />
              {expiringContracts.slice(0, 3).map((contract) => (
                <button
                  key={contract.id}
                  type="button"
                  onClick={() => navigate('/app/contracts')}
                  className="flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-medium">{contract.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(contract.endDate)} · {contract.daysUntilExpiration} día(s)
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Enlaces rápidos</CardTitle>
            <CardDescription>
              Navega directamente a los módulos principales del sistema.
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
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.helper}</span>
                </div>
                <ChevronRight className="ml-auto size-3.5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Operación del día</CardTitle>
            <CardDescription>
              Prioriza los flujos que suelen requerir seguimiento diario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <p className="text-sm font-semibold">Asistencia y solicitudes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Registra marcaciones, revisa permisos y atiende vacaciones pendientes
                desde los módulos operativos.
              </p>
            </div>
            {showExpiringContracts ? (
              <div className="rounded-2xl border bg-muted/40 p-4">
                <p className="text-sm font-semibold">Vigencia contractual</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mantén a la vista las renovaciones y vencimientos para evitar
                  quiebres operativos.
                </p>
              </div>
            ) : null}
            {showReports ? (
              <div className="rounded-2xl border bg-muted/40 p-4">
                <p className="text-sm font-semibold">Consulta y trazabilidad</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Genera reportes filtrados y revisa la bitácora operativa según tu rol.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function MetricBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
