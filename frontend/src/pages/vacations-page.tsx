import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Loader2, RefreshCcw, SendHorizontal } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/app/data-table'
import { EmptyState } from '@/components/app/empty-state'
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

type ReviewMode = 'approve' | 'reject'

export function VacationsPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''
  const roles = session?.user.roles ?? []

  const showOwn = roles.some((role) => ['EMPLOYEE', 'MANAGER'].includes(role))
  const showTeam = roles.includes('MANAGER')
  const showGlobal = roles.some((role) => ['ADMIN', 'HR'].includes(role))
  const canReviewGlobally = roles.includes('ADMIN')

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vacaciones"
        description="Consulta saldos, registra solicitudes y revisa aprobaciones según tu rol."
        actions={
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
        }
      />

      {showOwn ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,420px)]">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Mi historial de vacaciones</CardTitle>
              <CardDescription>
                Consulta tus solicitudes y el saldo disponible para nuevas fechas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ownBalance ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <BalanceStat label="Disponibles" value={ownBalance.availableDays} />
                  <BalanceStat label="Usados" value={ownBalance.usedDays} />
                  <BalanceStat label="Pendientes" value={ownBalance.pendingDays} />
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="vacations-my-status">Estado</Label>
                  <Select value={myStatus} onValueChange={setMyStatus}>
                    <SelectTrigger id="vacations-my-status">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="PENDING">Pendiente</SelectItem>
                      <SelectItem value="APPROVED">Aprobado</SelectItem>
                      <SelectItem value="REJECTED">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacations-my-start">Desde</Label>
                  <Input
                    id="vacations-my-start"
                    type="date"
                    value={myStartDate}
                    onChange={(event) => setMyStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacations-my-end">Hasta</Label>
                  <Input
                    id="vacations-my-end"
                    type="date"
                    value={myEndDate}
                    onChange={(event) => setMyEndDate(event.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <TableSkeleton rows={4} columns={4} />
              ) : (
                <DataTable
                  columns={[
                    {
                      key: 'dates',
                      header: 'Periodo',
                      render: (request) => (
                        <div>
                          <p className="font-medium">
                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.requestedDays} día(s) solicitados
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'status',
                      header: 'Estado',
                      render: (request) => (
                        <div className="space-y-2">
                          <StatusBadge value={request.status} />
                          {request.reviewComment ? (
                            <p className="text-xs text-muted-foreground">{request.reviewComment}</p>
                          ) : null}
                        </div>
                      ),
                    },
                    {
                      key: 'observation',
                      header: 'Observación',
                      render: (request) => request.observation ?? 'Sin observación',
                    },
                  ]}
                  rows={myRequests}
                  getRowKey={(request) => request.id}
                  emptyTitle="No hay solicitudes registradas"
                  emptyDescription="Tus solicitudes de vacaciones aparecerán aquí."
                  emptyIcon={CalendarDays}
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Nueva solicitud</CardTitle>
              <CardDescription>El rango se calcula en días calendario.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vacation-start-date">Inicio</Label>
                    <Input
                      id="vacation-start-date"
                      type="date"
                      value={form.startDate}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, startDate: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vacation-end-date">Fin</Label>
                    <Input
                      id="vacation-end-date"
                      type="date"
                      value={form.endDate}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, endDate: event.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacation-observation">Observación</Label>
                  <Textarea
                    id="vacation-observation"
                    value={form.observation}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, observation: event.target.value }))
                    }
                    placeholder="Motivo o contexto de la solicitud"
                  />
                </div>
                <Button disabled={saving} type="submit">
                  {saving ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
                  Enviar solicitud
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {showTeam ? (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Solicitudes pendientes del equipo</CardTitle>
            <CardDescription>
              {pendingCount} solicitud(es) pendiente(s) en tu área.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="vacations-team-status">Estado</Label>
                <Select value={teamStatus} onValueChange={setTeamStatus}>
                  <SelectTrigger id="vacations-team-status">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="APPROVED">Aprobado</SelectItem>
                    <SelectItem value="REJECTED">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vacations-team-start">Desde</Label>
                <Input
                  id="vacations-team-start"
                  type="date"
                  value={teamStartDate}
                  onChange={(event) => setTeamStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vacations-team-end">Hasta</Label>
                <Input
                  id="vacations-team-end"
                  type="date"
                  value={teamEndDate}
                  onChange={(event) => setTeamEndDate(event.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <TableSkeleton rows={4} columns={4} />
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'employee',
                    header: 'Empleado',
                    render: (request) => (
                      <div>
                        <p className="font-medium">{request.employeeName}</p>
                        <p className="text-muted-foreground">{request.positionName}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'period',
                    header: 'Periodo',
                    render: (request) => (
                      <div>
                        <p>
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.requestedDays} día(s)
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: (request) => <StatusBadge value={request.status} />,
                  },
                  {
                    key: 'actions',
                    header: 'Acciones',
                    render: (request) =>
                      request.status === 'PENDING' ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setReviewTarget(request)
                              setReviewMode('approve')
                              setReviewComment('')
                            }}
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewTarget(request)
                              setReviewMode('reject')
                              setReviewComment('')
                            }}
                          >
                            Rechazar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin acciones</span>
                      ),
                  },
                ]}
                rows={teamRequests}
                getRowKey={(request) => request.id}
                emptyTitle="No hay solicitudes del equipo"
                emptyDescription="Las solicitudes de vacaciones del equipo aparecerán aquí."
                emptyIcon={CalendarDays}
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {showGlobal ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,420px)]">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Solicitudes globales</CardTitle>
              <CardDescription>
                Consulta consolidada de vacaciones para administración y RR. HH.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="vacations-all-status">Estado</Label>
                  <Select value={allStatus} onValueChange={setAllStatus}>
                    <SelectTrigger id="vacations-all-status">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="PENDING">Pendiente</SelectItem>
                      <SelectItem value="APPROVED">Aprobado</SelectItem>
                      <SelectItem value="REJECTED">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacations-all-start">Desde</Label>
                  <Input
                    id="vacations-all-start"
                    type="date"
                    value={allStartDate}
                    onChange={(event) => setAllStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacations-all-end">Hasta</Label>
                  <Input
                    id="vacations-all-end"
                    type="date"
                    value={allEndDate}
                    onChange={(event) => setAllEndDate(event.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <TableSkeleton rows={5} columns={4} />
              ) : (
                <DataTable
                  columns={[
                    {
                      key: 'employee',
                      header: 'Empleado',
                      render: (request) => (
                        <div>
                          <p className="font-medium">{request.employeeName}</p>
                          <p className="text-muted-foreground">{request.areaName}</p>
                          <p className="text-xs text-muted-foreground">{request.positionName}</p>
                        </div>
                      ),
                    },
                    {
                      key: 'period',
                      header: 'Periodo',
                      render: (request) => (
                        <div>
                          <p>
                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.requestedDays} día(s)
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'status',
                      header: 'Estado',
                      render: (request) => (
                        <div className="space-y-2">
                          <StatusBadge value={request.status} />
                          {request.reviewComment ? (
                            <p className="text-xs text-muted-foreground">{request.reviewComment}</p>
                          ) : null}
                        </div>
                      ),
                    },
                    {
                      key: 'actions',
                      header: 'Acciones',
                      render: (request) =>
                        canReviewGlobally && request.status === 'PENDING' ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setReviewTarget(request)
                                setReviewMode('approve')
                                setReviewComment('')
                              }}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReviewTarget(request)
                                setReviewMode('reject')
                                setReviewComment('')
                              }}
                            >
                              Rechazar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Consulta</span>
                        ),
                    },
                  ]}
                  rows={allRequests}
                  getRowKey={(request) => request.id}
                  emptyTitle="No hay solicitudes registradas"
                  emptyDescription="La vista global se llenará cuando existan solicitudes."
                  emptyIcon={CalendarDays}
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Ajuste de saldo</CardTitle>
              <CardDescription>
                Carga o corrige saldos manuales de vacaciones por colaborador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleBalanceSave}>
                <div className="space-y-2">
                  <Label htmlFor="vacation-balance-employee">Empleado</Label>
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    <SelectTrigger id="vacation-balance-employee">
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
                  <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {selectedEmployeeBalance.employeeName}
                    </p>
                    <p>
                      Disponibles: {selectedEmployeeBalance.availableDays} · Usados:{' '}
                      {selectedEmployeeBalance.usedDays} · Pendientes:{' '}
                      {selectedEmployeeBalance.pendingDays}
                    </p>
                  </div>
                ) : null}

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
                  />
                </div>

                <Button disabled={saving} type="submit">
                  {saving ? <Loader2 className="animate-spin" /> : null}
                  Guardar saldo
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {reviewTarget ? (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>
              {reviewMode === 'approve'
                ? 'Aprobar solicitud de vacaciones'
                : 'Rechazar solicitud de vacaciones'}
            </CardTitle>
            <CardDescription>
              {reviewTarget.employeeName} · {reviewTarget.requestedDays} día(s) solicitados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleReview}>
              <div className="space-y-2">
                <Label htmlFor="vacation-review-comment">Comentario</Label>
                <Textarea
                  id="vacation-review-comment"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Escribe una observación sobre la decisión"
                  required
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button disabled={saving} type="submit">
                  {saving ? <Loader2 className="animate-spin" /> : null}
                  {reviewMode === 'approve'
                    ? 'Confirmar aprobación'
                    : 'Confirmar rechazo'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReviewTarget(null)
                    setReviewComment('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {!showOwn && !showTeam && !showGlobal ? (
        <EmptyState
          title="Sin acceso a vacaciones"
          description="Tu rol actual no tiene vistas habilitadas para este módulo."
          icon={CalendarDays}
        />
      ) : null}
    </div>
  )
}

function BalanceStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
