import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { BarChart } from '@/components/app/charts/bar-chart'
import { DonutChart } from '@/components/app/charts/donut-chart'
import { MetricCard } from '@/components/app/metric-card'
import { StatusBadge } from '@/components/app/status-badge'
import { useAuth } from '@/contexts/auth-context'
import { formatDate } from '@/lib/format'
import { apiRequest, getApiMessage } from '@/lib/http'
import { getRoleLabel } from '@/lib/roles'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type {
  ExpiringContractItem,
  VacationBalance,
  VacationRequestRecord,
} from '@/types/domain'

const attendanceSample = [
  { label: 'Lun', value: 48 },
  { label: 'Mar', value: 52 },
  { label: 'Mié', value: 49 },
  { label: 'Jue', value: 51 },
  { label: 'Vie', value: 47 },
]

const leaveDistributionSample = [
  { label: 'Aprobadas', value: 12 },
  { label: 'Pendientes', value: 5 },
  { label: 'Rechazadas', value: 2 },
]

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
            apiRequest<VacationBalance>('/vacations/balance/me', { token }).then(setOwnBalance),
          )
        }

        if (roles.includes('MANAGER')) {
          tasks.push(
            apiRequest<VacationRequestRecord[]>('/vacations/requests/team?status=PENDING', {
              token,
            }).then(setPendingRequests),
          )
        } else if (roles.some((role) => ['ADMIN', 'HR'].includes(role))) {
          tasks.push(
            apiRequest<VacationRequestRecord[]>('/vacations/requests/all?status=PENDING', {
              token,
            }).then(setPendingRequests),
          )
        }

        if (showExpiringContracts) {
          tasks.push(
            apiRequest<ExpiringContractItem[]>('/contracts/expiring', { token }).then(
              setExpiringContracts,
            ),
          )
        }

        await Promise.all(tasks)
      } catch (error) {
        toast.error(getApiMessage(error, 'No se pudo cargar el resumen del dashboard.'))
      }
    }

    void loadDashboard()
  }, [roles, showExpiringContracts, showOwnVacation, token])

  const userInitials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const primaryRole = user?.roles[0] ?? 'USER'

  const quickActions = useMemo(
    () =>
      [
        {
          title: 'Asistencia',
          description: 'Control diario',
          to: '/app/attendance',
          icon: CalendarClock,
          visible: true,
        },
        {
          title: 'Permisos',
          description: 'Solicitudes',
          to: '/app/leave-requests',
          icon: ClipboardList,
          visible: true,
        },
        {
          title: 'Vacaciones',
          description: 'Saldos y aprobaciones',
          to: '/app/vacations',
          icon: CalendarDays,
          visible: true,
        },
        {
          title: 'Empleados',
          description: 'Base de personal',
          to: '/app/employees',
          icon: Users,
          visible: showEmployeeModules,
        },
        {
          title: 'Contratos',
          description: 'Vigencias',
          to: '/app/contracts',
          icon: BriefcaseBusiness,
          visible: showExpiringContracts,
        },
      ].filter((item) => item.visible),
    [showEmployeeModules, showExpiringContracts],
  )

  const vacationProgress = ownBalance
    ? Math.min(100, Math.round((ownBalance.usedDays / (ownBalance.availableDays + ownBalance.usedDays + ownBalance.pendingDays || 1)) * 100))
    : 0

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome header */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 border border-border/60">
            <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Hola, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(new Date().toISOString())} · Rol: {getRoleLabel(primaryRole)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.slice(0, 3).map((action) => (
            <Button
              key={action.title}
              variant="outline"
              size="sm"
              onClick={() => navigate(action.to)}
              className="gap-1.5"
            >
              <action.icon className="size-3.5" />
              {action.title}
            </Button>
          ))}
        </div>
      </section>

      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de empleados"
          value="—"
          description="Próximamente"
          icon={Users}
        />
        <MetricCard
          title="Asistencia hoy"
          value="—"
          description="Próximamente"
          icon={CalendarClock}
        />
        <MetricCard
          title="Permisos pendientes"
          value={pendingRequests.length}
          description="Requieren revisión"
          icon={ClipboardList}
          trend={{ value: `${pendingRequests.length}`, positive: pendingRequests.length === 0 }}
        />
        <MetricCard
          title="Contratos por vencer"
          value={expiringContracts.length}
          description="Próximos 30 días"
          icon={BriefcaseBusiness}
        />
      </section>

      {/* Charts and account */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Asistencia semanal</CardTitle>
              <CardDescription>Registros de los últimos 5 días hábiles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <BarChart data={attendanceSample} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Distribución de solicitudes</CardTitle>
              <CardDescription>Estado actual de permisos y vacaciones.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <DonutChart data={leaveDistributionSample} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Tu cuenta</CardTitle>
            <CardDescription>Información de acceso y roles.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Correo</span>
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
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

      {/* Vacation and pending requests */}
      <section className="grid gap-6 lg:grid-cols-3">
        {showOwnVacation ? (
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium">Mi saldo de vacaciones</CardTitle>
              <CardDescription>Resumen de disponibilidad actual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {ownBalance ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Disponibles</span>
                      <span className="font-semibold">{ownBalance.availableDays} días</span>
                    </div>
                    <Progress value={vacationProgress} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
                      <p className="text-lg font-semibold">{ownBalance.availableDays}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Disp.</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
                      <p className="text-lg font-semibold">{ownBalance.usedDays}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Usados</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
                      <p className="text-lg font-semibold">{ownBalance.pendingDays}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pend.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                  Tu saldo aún no está cargado. Contacta a RR. HH. para registrar tu saldo inicial.
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {showPendingVacations ? (
          <Card className="rounded-2xl border-border/60 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Vacaciones pendientes</CardTitle>
                <CardDescription>
                  {roles.includes('MANAGER')
                    ? 'Solicitudes del equipo pendientes de revisión.'
                    : 'Solicitudes pendientes para seguimiento operativo.'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/vacations')}>
                Ver todas <ArrowRight className="ml-1 size-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingRequests.length > 0 ? (
                pendingRequests.slice(0, 4).map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => navigate('/app/vacations')}
                    className="flex w-full items-center justify-between rounded-xl border border-border/60 p-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <div>
                      <p className="text-sm font-medium">{request.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </p>
                    </div>
                    <StatusBadge value={request.status} />
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  No hay solicitudes pendientes por revisar.
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </section>

      {/* Expiring contracts */}
      {showExpiringContracts ? (
        <section>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Contratos por vencer</CardTitle>
                <CardDescription>Alertas visibles para los próximos 30 días.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/contracts')}>
                Ver contratos <ArrowRight className="ml-1 size-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {expiringContracts.length > 0 ? (
                expiringContracts.slice(0, 4).map((contract) => (
                  <button
                    key={contract.id}
                    type="button"
                    onClick={() => navigate('/app/contracts')}
                    className="flex w-full items-center justify-between rounded-xl border border-border/60 p-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <div>
                      <p className="text-sm font-medium">{contract.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(contract.endDate)} · {contract.daysUntilExpiration} día(s)
                      </p>
                    </div>
                    <Badge variant="secondary">{contract.daysUntilExpiration} días</Badge>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  No hay contratos por vencer en los próximos 30 días.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  )
}
