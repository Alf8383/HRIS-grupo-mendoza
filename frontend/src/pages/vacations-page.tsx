import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Loader2,
  Plus,
  RefreshCcw,
  SlidersHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'

import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/app/data-table'
import { EmptyState } from '@/components/app/empty-state'
import { EntityDrawer, EntityDrawerActions } from '@/components/app/entity-drawer'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { TableSkeleton } from '@/components/app/table-skeleton'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { formatDate } from '@/lib/format'
import { apiRequest, getApiMessage } from '@/lib/http'
import type {
  EmployeeRecord,
  VacationBalance,
  VacationRequestRecord,
} from '@/types/domain'

const initialVacationForm = {
  startDate: '',
  endDate: '',
  observation: '',
}

const statusOptions = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'APPROVED', label: 'Aprobado' },
  { value: 'REJECTED', label: 'Rechazado' },
]

type ReviewMode = 'approve' | 'reject'

export function VacationsPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''
  const roles = session?.user.roles ?? []

  const showOwn = roles.some((role) => ['EMPLOYEE', 'MANAGER'].includes(role))
  const showTeam = roles.includes('MANAGER')
  const showGlobal = roles.some((role) => ['ADMIN', 'HR'].includes(role))
  const canReviewGlobally = roles.includes('ADMIN')

  const defaultTab = showOwn ? 'own' : showTeam ? 'team' : 'all'

  const [form, setForm] = useState(initialVacationForm)
  const [ownBalance, setOwnBalance] = useState<VacationBalance | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('ALL')
  const [selectedEmployeeBalance, setSelectedEmployeeBalance] = useState<VacationBalance | null>(null)
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [myRequests, setMyRequests] = useState<VacationRequestRecord[]>([])
  const [teamRequests, setTeamRequests] = useState<VacationRequestRecord[]>([])
  const [allRequests, setAllRequests] = useState<VacationRequestRecord[]>([])
  const [teamStatus, setTeamStatus] = useState('ALL')
  const [allStatus, setAllStatus] = useState('ALL')
  const [myStatus, setMyStatus] = useState('ALL')
  const [teamStartDate, setTeamStartDate] = useState('')
  const [teamEndDate, setTeamEndDate] = useState('')
  const [allStartDate, setAllStartDate] = useState('')
  const [allEndDate, setAllEndDate] = useState('')
  const [myStartDate, setMyStartDate] = useState('')
  const [myEndDate, setMyEndDate] = useState('')
  const [balanceForm, setBalanceForm] = useState({
    availableDays: '0',
    usedDays: '0',
    pendingDays: '0',
    notes: '',
  })
  const [reviewTarget, setReviewTarget] = useState<VacationRequestRecord | null>(null)
  const [reviewMode, setReviewMode] = useState<ReviewMode>('approve')
  const [reviewComment, setReviewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false)
  const [balanceDrawerOpen, setBalanceDrawerOpen] = useState(false)

  const buildQuery = (status: string, startDate: string, endDate: string) => {
    const params = new URLSearchParams()
    if (status !== 'ALL') params.set('status', status)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    return params.size ? `?${params.toString()}` : ''
  }

  const loadEmployees = useCallback(async () => {
    if (!token || !showGlobal) {
      return
    }

    try {
      const response = await apiRequest<EmployeeRecord[]>('/employees?status=ACTIVE', {
        token,
      })
      setEmployees(response)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo cargar la lista de empleados.'))
    }
  }, [showGlobal, token])

  const loadBalances = useCallback(async () => {
    if (!token) {
      return
    }

    try {
      if (showOwn) {
        const response = await apiRequest<VacationBalance>('/vacations/balance/me', { token })
        setOwnBalance(response)
      }

      if (showGlobal && selectedEmployeeId !== 'ALL') {
        const response = await apiRequest<VacationBalance>(
          `/vacations/balance/${selectedEmployeeId}`,
          { token },
        )
        setSelectedEmployeeBalance(response)
        setBalanceForm({
          availableDays: String(response.availableDays),
          usedDays: String(response.usedDays),
          pendingDays: String(response.pendingDays),
          notes: response.notes ?? '',
        })
      } else if (showGlobal) {
        setSelectedEmployeeBalance(null)
        setBalanceForm({
          availableDays: '0',
          usedDays: '0',
          pendingDays: '0',
          notes: '',
        })
      }
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudieron cargar los saldos de vacaciones.'))
    }
  }, [selectedEmployeeId, showGlobal, showOwn, token])

  const loadRequests = useCallback(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    try {
      const tasks: Promise<void>[] = []

      if (showOwn) {
        tasks.push(
          apiRequest<VacationRequestRecord[]>(
            `/vacations/requests/my${buildQuery(myStatus, myStartDate, myEndDate)}`,
            { token },
          ).then(setMyRequests),
        )
      }

      if (showTeam) {
        tasks.push(
          apiRequest<VacationRequestRecord[]>(
            `/vacations/requests/team${buildQuery(teamStatus, teamStartDate, teamEndDate)}`,
            { token },
          ).then(setTeamRequests),
        )
      }

      if (showGlobal) {
        tasks.push(
          apiRequest<VacationRequestRecord[]>(
            `/vacations/requests/all${buildQuery(allStatus, allStartDate, allEndDate)}`,
            { token },
          ).then(setAllRequests),
        )
      }

      await Promise.all(tasks)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudieron cargar las solicitudes de vacaciones.'))
    } finally {
      setLoading(false)
    }
  }, [
    allEndDate,
    allStartDate,
    allStatus,
    myEndDate,
    myStartDate,
    myStatus,
    showGlobal,
    showOwn,
    showTeam,
    teamEndDate,
    teamStartDate,
    teamStatus,
    token,
  ])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEmployees()
  }, [loadEmployees, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBalances()
  }, [loadBalances, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRequests()
  }, [loadRequests, token])

  const pendingCount = useMemo(
    () =>
      (showGlobal ? allRequests : teamRequests).filter((request) => request.status === 'PENDING')
        .length,
    [allRequests, showGlobal, teamRequests],
  )

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    try {
      await apiRequest('/vacations/requests', {
        method: 'POST',
        token,
        body: JSON.stringify(form),
      })
      toast.success('Solicitud de vacaciones registrada.')
      setForm(initialVacationForm)
      setRequestDrawerOpen(false)
      await Promise.all([loadBalances(), loadRequests()])
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo registrar la solicitud de vacaciones.'))
    } finally {
      setSaving(false)
    }
  }

  const handleBalanceSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedEmployeeId === 'ALL') {
      toast.error('Selecciona un empleado para ajustar el saldo.')
      return
    }

    setSaving(true)
    try {
      await apiRequest(`/vacations/balance/${selectedEmployeeId}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({
          availableDays: Number(balanceForm.availableDays),
          usedDays: Number(balanceForm.usedDays),
          pendingDays: Number(balanceForm.pendingDays),
          notes: balanceForm.notes || null,
        }),
      })
      toast.success('Saldo de vacaciones actualizado.')
      setBalanceDrawerOpen(false)
      await Promise.all([loadBalances(), loadRequests()])
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo actualizar el saldo.'))
    } finally {
      setSaving(false)
    }
  }

  const handleReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reviewTarget) return

    setSaving(true)
    try {
      await apiRequest(
        `/vacations/requests/${reviewTarget.id}/${reviewMode === 'approve' ? 'approve' : 'reject'}`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({ reviewComment }),
        },
      )
      toast.success(
        reviewMode === 'approve'
          ? 'Solicitud de vacaciones aprobada.'
          : 'Solicitud de vacaciones rechazada.',
      )
      setReviewTarget(null)
      setReviewComment('')
      await Promise.all([loadBalances(), loadRequests()])
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo revisar la solicitud.'))
    } finally {
      setSaving(false)
    }
  }

  const openReview = (request: VacationRequestRecord, mode: ReviewMode) => {
    setReviewTarget(request)
    setReviewMode(mode)
    setReviewComment('')
  }

  const openBalanceDrawer = () => {
    if (selectedEmployeeId === 'ALL') {
      toast.error('Selecciona un empleado para ajustar el saldo.')
      return
    }
    setBalanceDrawerOpen(true)
  }

  const ownColumns = useMemo<ColumnDef<VacationRequestRecord>[]>(
    () => [
      {
        accessorKey: 'dates',
        header: 'Periodo',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">
              {formatDate(row.original.startDate)} - {formatDate(row.original.endDate)}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.requestedDays} día(s) solicitados</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => (
          <div className="space-y-1">
            <StatusBadge value={row.original.status} />
            {row.original.reviewComment ? (
              <p className="text-xs text-muted-foreground">{row.original.reviewComment}</p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'observation',
        header: 'Observación',
        cell: ({ row }) => row.original.observation ?? 'Sin observación',
      },
    ],
    [],
  )

  const teamColumns = useMemo<ColumnDef<VacationRequestRecord>[]>(
    () => [
      {
        accessorKey: 'employee',
        header: 'Empleado',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.employeeName}</p>
            <p className="text-sm text-muted-foreground">{row.original.positionName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'period',
        header: 'Periodo',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>
              {formatDate(row.original.startDate)} - {formatDate(row.original.endDate)}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.requestedDays} día(s)</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <StatusBadge value={row.original.status} />,
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) =>
          row.original.status === 'PENDING' ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => openReview(row.original, 'approve')}>
                Aprobar
              </Button>
              <Button size="sm" variant="outline" onClick={() => openReview(row.original, 'reject')}>
                Rechazar
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Sin acciones</span>
          ),
      },
    ],
    [],
  )

  const allColumns = useMemo<ColumnDef<VacationRequestRecord>[]>(
    () => [
      {
        accessorKey: 'employee',
        header: 'Empleado',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.employeeName}</p>
            <p className="text-sm text-muted-foreground">{row.original.areaName}</p>
            <p className="text-xs text-muted-foreground">{row.original.positionName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'period',
        header: 'Periodo',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>
              {formatDate(row.original.startDate)} - {formatDate(row.original.endDate)}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.requestedDays} día(s)</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => (
          <div className="space-y-1">
            <StatusBadge value={row.original.status} />
            {row.original.reviewComment ? (
              <p className="text-xs text-muted-foreground">{row.original.reviewComment}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) =>
          canReviewGlobally && row.original.status === 'PENDING' ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => openReview(row.original, 'approve')}>
                Aprobar
              </Button>
              <Button size="sm" variant="outline" onClick={() => openReview(row.original, 'reject')}>
                Rechazar
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Consulta</span>
          ),
      },
    ],
    [canReviewGlobally],
  )

  const renderFilters = (
    status: string,
    setStatus: (value: string) => void,
    startDate: string,
    setStartDate: (value: string) => void,
    endDate: string,
    setEndDate: (value: string) => void,
    idPrefix: string,
  ) => (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-status`}>Estado</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id={`${idPrefix}-status`} className="rounded-lg border-border/60">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-start`}>Desde</Label>
        <Input
          id={`${idPrefix}-start`}
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="rounded-lg border-border/60"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-end`}>Hasta</Label>
        <Input
          id={`${idPrefix}-end`}
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="rounded-lg border-border/60"
        />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vacaciones"
        description="Consulta saldos, registra solicitudes y revisa aprobaciones según tu rol."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await Promise.all([loadBalances(), loadRequests()])
              }}
            >
              <RefreshCcw />
              Actualizar
            </Button>
            {showOwn && (
              <Button onClick={() => setRequestDrawerOpen(true)}>
                <Plus className="mr-1.5 size-4" />
                Nueva solicitud
              </Button>
            )}
          </div>
        }
      />

      {showOwn || showTeam || showGlobal ? (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-4">
            {showOwn && <TabsTrigger value="own">Mis solicitudes</TabsTrigger>}
            {showTeam && <TabsTrigger value="team">Equipo</TabsTrigger>}
            {showGlobal && <TabsTrigger value="all">Todas</TabsTrigger>}
          </TabsList>

          {showOwn && (
            <TabsContent value="own">
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Mi historial de vacaciones</CardTitle>
                  <CardDescription>
                    Consulta tus solicitudes y el saldo disponible para nuevas fechas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ownBalance ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      <VacationBalanceCard
                        label="Disponibles"
                        value={ownBalance.availableDays}
                        total={ownBalance.availableDays + ownBalance.usedDays + ownBalance.pendingDays}
                        tone="amber"
                      />
                      <VacationBalanceCard
                        label="Usados"
                        value={ownBalance.usedDays}
                        total={ownBalance.availableDays + ownBalance.usedDays + ownBalance.pendingDays}
                        tone="stone"
                      />
                      <VacationBalanceCard
                        label="Pendientes"
                        value={ownBalance.pendingDays}
                        total={ownBalance.availableDays + ownBalance.usedDays + ownBalance.pendingDays}
                        tone="orange"
                      />
                    </div>
                  ) : null}

                  {renderFilters(
                    myStatus,
                    setMyStatus,
                    myStartDate,
                    setMyStartDate,
                    myEndDate,
                    setMyEndDate,
                    'vacations-my',
                  )}

                  {loading ? (
                    <TableSkeleton rows={4} columns={3} />
                  ) : (
                    <DataTable
                      columns={ownColumns}
                      data={myRequests}
                      searchPlaceholder="Buscar solicitud..."
                      pageSize={10}
                      emptyState={
                        <EmptyState
                          icon={CalendarDays}
                          title="No hay solicitudes registradas"
                          description="Tus solicitudes de vacaciones aparecerán aquí."
                          actionLabel="Nueva solicitud"
                          onAction={() => setRequestDrawerOpen(true)}
                        />
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {showTeam && (
            <TabsContent value="team">
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Solicitudes pendientes del equipo</CardTitle>
                  <CardDescription>{pendingCount} solicitud(es) pendiente(s) en tu área.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderFilters(
                    teamStatus,
                    setTeamStatus,
                    teamStartDate,
                    setTeamStartDate,
                    teamEndDate,
                    setTeamEndDate,
                    'vacations-team',
                  )}

                  {loading ? (
                    <TableSkeleton rows={4} columns={4} />
                  ) : (
                    <DataTable
                      columns={teamColumns}
                      data={teamRequests}
                      searchPlaceholder="Buscar solicitud..."
                      pageSize={10}
                      emptyState={
                        <EmptyState
                          icon={CalendarDays}
                          title="No hay solicitudes del equipo"
                          description="Las solicitudes de vacaciones del equipo aparecerán aquí."
                        />
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {showGlobal && (
            <TabsContent value="all">
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,420px)]">
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle>Solicitudes globales</CardTitle>
                    <CardDescription>
                      Consulta consolidada de vacaciones para administración y RR. HH.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderFilters(
                      allStatus,
                      setAllStatus,
                      allStartDate,
                      setAllStartDate,
                      allEndDate,
                      setAllEndDate,
                      'vacations-all',
                    )}

                    {loading ? (
                      <TableSkeleton rows={5} columns={4} />
                    ) : (
                      <DataTable
                        columns={allColumns}
                        data={allRequests}
                        searchPlaceholder="Buscar solicitud..."
                        pageSize={10}
                        emptyState={
                          <EmptyState
                            icon={CalendarDays}
                            title="No hay solicitudes registradas"
                            description="La vista global se llenará cuando existan solicitudes."
                          />
                        }
                      />
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle>Saldo de vacaciones</CardTitle>
                    <CardDescription>Consulta y ajusta saldos por colaborador.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="vacation-balance-employee">Empleado</Label>
                      <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                        <SelectTrigger id="vacation-balance-employee" className="rounded-lg border-border/60">
                          <SelectValue placeholder="Selecciona un empleado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Seleccionar</SelectItem>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={String(employee.id)}>
                              {employee.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedEmployeeBalance ? (
                      <div className="space-y-4">
                        <div className="grid gap-3">
                          <VacationBalanceCard
                            label="Disponibles"
                            value={selectedEmployeeBalance.availableDays}
                            total={
                              selectedEmployeeBalance.availableDays +
                              selectedEmployeeBalance.usedDays +
                              selectedEmployeeBalance.pendingDays
                            }
                            tone="amber"
                          />
                          <VacationBalanceCard
                            label="Usados"
                            value={selectedEmployeeBalance.usedDays}
                            total={
                              selectedEmployeeBalance.availableDays +
                              selectedEmployeeBalance.usedDays +
                              selectedEmployeeBalance.pendingDays
                            }
                            tone="stone"
                          />
                          <VacationBalanceCard
                            label="Pendientes"
                            value={selectedEmployeeBalance.pendingDays}
                            total={
                              selectedEmployeeBalance.availableDays +
                              selectedEmployeeBalance.usedDays +
                              selectedEmployeeBalance.pendingDays
                            }
                            tone="orange"
                          />
                        </div>
                        <Button onClick={openBalanceDrawer} className="w-full">
                          <SlidersHorizontal className="mr-1.5 size-4" />
                          Ajustar saldo
                        </Button>
                      </div>
                    ) : (
                      <EmptyState
                        icon={CalendarDays}
                        title="Selecciona un colaborador"
                        description="Elige un empleado para ver su saldo de vacaciones."
                        className="py-8"
                      />
                    )}
                  </CardContent>
                </Card>
              </section>
            </TabsContent>
          )}
        </Tabs>
      ) : null}

      <EntityDrawer
        open={requestDrawerOpen}
        onOpenChange={setRequestDrawerOpen}
        title="Nueva solicitud"
        description="El rango se calcula en días calendario."
        footer={
          <EntityDrawerActions
            onCancel={() => {
              setRequestDrawerOpen(false)
              setForm(initialVacationForm)
            }}
            isLoading={saving}
            submitLabel="Enviar solicitud"
            form="vacation-request-form"
          />
        }
      >
        <form id="vacation-request-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vacation-start-date">Inicio</Label>
              <Input
                id="vacation-start-date"
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                required
                className="rounded-lg border-border/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vacation-end-date">Fin</Label>
              <Input
                id="vacation-end-date"
                type="date"
                value={form.endDate}
                onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                required
                className="rounded-lg border-border/60"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vacation-observation">Observación</Label>
            <Textarea
              id="vacation-observation"
              value={form.observation}
              onChange={(event) => setForm((current) => ({ ...current, observation: event.target.value }))}
              placeholder="Motivo o contexto de la solicitud"
              className="rounded-lg border-border/60"
            />
          </div>
          {saving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Enviando...
            </div>
          )}
        </form>
      </EntityDrawer>

      <EntityDrawer
        open={balanceDrawerOpen}
        onOpenChange={setBalanceDrawerOpen}
        title="Ajuste de saldo"
        description={
          selectedEmployeeBalance
            ? `${selectedEmployeeBalance.employeeName} · saldo actual`
            : 'Carga o corrige saldos manuales de vacaciones por colaborador.'
        }
        footer={
          <EntityDrawerActions
            onCancel={() => setBalanceDrawerOpen(false)}
            isLoading={saving}
            submitLabel="Guardar saldo"
            form="vacation-balance-form"
          />
        }
      >
        <form id="vacation-balance-form" onSubmit={handleBalanceSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="vacation-balance-available">Disponibles</Label>
              <Input
                id="vacation-balance-available"
                type="number"
                min="0"
                value={balanceForm.availableDays}
                onChange={(event) =>
                  setBalanceForm((current) => ({
                    ...current,
                    availableDays: event.target.value,
                  }))
                }
                className="rounded-lg border-border/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vacation-balance-used">Usados</Label>
              <Input
                id="vacation-balance-used"
                type="number"
                min="0"
                value={balanceForm.usedDays}
                onChange={(event) =>
                  setBalanceForm((current) => ({
                    ...current,
                    usedDays: event.target.value,
                  }))
                }
                className="rounded-lg border-border/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vacation-balance-pending">Pendientes</Label>
              <Input
                id="vacation-balance-pending"
                type="number"
                min="0"
                value={balanceForm.pendingDays}
                onChange={(event) =>
                  setBalanceForm((current) => ({
                    ...current,
                    pendingDays: event.target.value,
                  }))
                }
                className="rounded-lg border-border/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vacation-balance-notes">Notas</Label>
            <Textarea
              id="vacation-balance-notes"
              value={balanceForm.notes}
              onChange={(event) =>
                setBalanceForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Contexto del ajuste manual"
              className="rounded-lg border-border/60"
            />
          </div>
          {saving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Guardando...
            </div>
          )}
        </form>
      </EntityDrawer>

      <EntityDrawer
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReviewTarget(null)
            setReviewComment('')
          }
        }}
        title={
          reviewMode === 'approve' ? 'Aprobar solicitud de vacaciones' : 'Rechazar solicitud de vacaciones'
        }
        description={
          reviewTarget
            ? `${reviewTarget.employeeName} · ${reviewTarget.requestedDays} día(s) solicitados`
            : ''
        }
        footer={
          <EntityDrawerActions
            onCancel={() => {
              setReviewTarget(null)
              setReviewComment('')
            }}
            isLoading={saving}
            submitLabel={reviewMode === 'approve' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
            form="vacation-review-form"
          />
        }
      >
        <form id="vacation-review-form" onSubmit={handleReview} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vacation-review-comment">Comentario</Label>
            <Textarea
              id="vacation-review-comment"
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder="Escribe una observación sobre la decisión"
              required
              className="rounded-lg border-border/60"
            />
          </div>
          {saving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Guardando...
            </div>
          )}
        </form>
      </EntityDrawer>

      {!showOwn && !showTeam && !showGlobal ? (
        <EmptyState
          icon={CalendarDays}
          title="Sin acceso a vacaciones"
          description="Tu rol actual no tiene vistas habilitadas para este módulo."
        />
      ) : null}
    </div>
  )
}

function VacationBalanceCard({
  label,
  value,
  total,
  tone,
}: {
  label: string
  value: number
  total: number
  tone: 'amber' | 'stone' | 'orange'
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0
  const toneStyles = {
    amber: {
      card: 'bg-amber-50/60 border-amber-200/60',
      text: 'text-amber-800',
      icon: 'text-amber-600',
      progress: 'bg-amber-500',
    },
    stone: {
      card: 'bg-stone-50/60 border-stone-200/60',
      text: 'text-stone-700',
      icon: 'text-stone-500',
      progress: 'bg-stone-500',
    },
    orange: {
      card: 'bg-orange-50/60 border-orange-200/60',
      text: 'text-orange-800',
      icon: 'text-orange-600',
      progress: 'bg-orange-500',
    },
  }

  return (
    <div className={`rounded-xl border p-4 ${toneStyles[tone].card}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium uppercase tracking-[0.14em] ${toneStyles[tone].text}`}>{label}</p>
        <CalendarDays className={`size-4 ${toneStyles[tone].icon}`} />
      </div>
      <p className={`mt-2 text-2xl font-semibold ${toneStyles[tone].text}`}>{value}</p>
      <div className="mt-3">
        <div className="relative flex h-1.5 w-full items-center overflow-hidden rounded-full bg-background">
          <div
            className={`h-full rounded-full transition-all ${toneStyles[tone].progress}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{percentage}% del total</p>
      </div>
    </div>
  )
}
