import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCcw, SendHorizontal } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/app/data-table'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
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
import { useAuth } from '@/contexts/auth-context'
import { formatDateTime } from '@/lib/format'
import { apiRequest, getApiMessage } from '@/lib/http'
import type { LeaveRequestRecord } from '@/types/domain'

const LEAVE_TYPE_LABELS: Record<string, string> = {
  PERSONAL_PERMISSION: 'Permiso personal',
  MEDICAL_LEAVE: 'Licencia médica',
  OTHER_LICENSE: 'Otra licencia',
}

type ReviewMode = 'approve' | 'reject'

const initialForm = {
  requestType: 'PERSONAL_PERMISSION',
  startAt: '',
  endAt: '',
  reason: '',
}

export function LeaveRequestsPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''
  const roles = session?.user.roles ?? []
  const showOwnRequests = roles.some((role) => ['EMPLOYEE', 'MANAGER'].includes(role))
  const showTeamRequests = roles.includes('MANAGER')
  const showAllRequests = roles.some((role) => ['ADMIN', 'HR'].includes(role))
  const canReviewAll = roles.includes('ADMIN')

  const [form, setForm] = useState(initialForm)
  const [myRequests, setMyRequests] = useState<LeaveRequestRecord[]>([])
  const [teamRequests, setTeamRequests] = useState<LeaveRequestRecord[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequestRecord[]>([])
  const [myStatus, setMyStatus] = useState('ALL')
  const [teamStatus, setTeamStatus] = useState('ALL')
  const [allStatus, setAllStatus] = useState('ALL')
  const [myStartDate, setMyStartDate] = useState('')
  const [myEndDate, setMyEndDate] = useState('')
  const [teamStartDate, setTeamStartDate] = useState('')
  const [teamEndDate, setTeamEndDate] = useState('')
  const [allStartDate, setAllStartDate] = useState('')
  const [allEndDate, setAllEndDate] = useState('')
  const [reviewTarget, setReviewTarget] = useState<LeaveRequestRecord | null>(null)
  const [reviewMode, setReviewMode] = useState<ReviewMode>('approve')
  const [reviewComment, setReviewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const buildQuery = (status: string, startDate: string, endDate: string) => {
    const params = new URLSearchParams()
    if (status !== 'ALL') params.set('status', status)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    return params.size ? `?${params.toString()}` : ''
  }

  const loadRequests = useCallback(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    try {
      const tasks: Promise<void>[] = []

      if (showOwnRequests) {
        tasks.push(
          apiRequest<LeaveRequestRecord[]>(
            `/leave-requests/my${buildQuery(myStatus, myStartDate, myEndDate)}`,
            { token },
          ).then(setMyRequests),
        )
      }

      if (showTeamRequests) {
        tasks.push(
          apiRequest<LeaveRequestRecord[]>(
            `/leave-requests/team${buildQuery(teamStatus, teamStartDate, teamEndDate)}`,
            { token },
          ).then(setTeamRequests),
        )
      }

      if (showAllRequests) {
        tasks.push(
          apiRequest<LeaveRequestRecord[]>(
            `/leave-requests/all${buildQuery(allStatus, allStartDate, allEndDate)}`,
            { token },
          ).then(setAllRequests),
        )
      }

      await Promise.all(tasks)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudieron cargar las solicitudes.'))
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
    showAllRequests,
    showOwnRequests,
    showTeamRequests,
    teamEndDate,
    teamStartDate,
    teamStatus,
    token,
  ])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRequests()
  }, [loadRequests, token])

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    try {
      await apiRequest('/leave-requests', {
        method: 'POST',
        token,
        body: JSON.stringify(form),
      })
      toast.success('Solicitud registrada correctamente.')
      setForm(initialForm)
      await loadRequests()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo registrar la solicitud.'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (requestId: number) => {
    setCancellingId(requestId)
    try {
      await apiRequest(`/leave-requests/${requestId}/cancel`, {
        method: 'POST',
        token,
      })
      toast.success('Solicitud cancelada.')
      await loadRequests()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo cancelar la solicitud.'))
    } finally {
      setCancellingId(null)
    }
  }

  const handleReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reviewTarget) return

    setSaving(true)
    try {
      await apiRequest(
        `/leave-requests/${reviewTarget.id}/${reviewMode === 'approve' ? 'approve' : 'reject'}`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({ reviewComment }),
        },
      )
      toast.success(reviewMode === 'approve' ? 'Solicitud aprobada.' : 'Solicitud rechazada.')
      setReviewTarget(null)
      setReviewComment('')
      await loadRequests()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo actualizar la solicitud.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Permisos y licencias"
        description="Registra solicitudes, controla sus estados y gestiona aprobaciones según tu rol."
        actions={
          <Button type="button" variant="outline" onClick={() => void loadRequests()}>
            <RefreshCcw />
            Actualizar
          </Button>
        }
      />

      {showOwnRequests ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,420px)]">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Mis solicitudes</CardTitle>
              <CardDescription>Consulta tus solicitudes y sus estados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="my-leaves-status">Estado</Label>
                  <Select value={myStatus} onValueChange={setMyStatus}>
                    <SelectTrigger id="my-leaves-status">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="PENDING">Pendiente</SelectItem>
                      <SelectItem value="APPROVED">Aprobado</SelectItem>
                      <SelectItem value="REJECTED">Rechazado</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="my-leaves-start">Desde</Label>
                  <Input
                    id="my-leaves-start"
                    type="date"
                    value={myStartDate}
                    onChange={(event) => setMyStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="my-leaves-end">Hasta</Label>
                  <Input
                    id="my-leaves-end"
                    type="date"
                    value={myEndDate}
                    onChange={(event) => setMyEndDate(event.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Cargando solicitudes...
                </div>
              ) : (
                <DataTable
                  columns={[
                    {
                      key: 'type',
                      header: 'Tipo',
                      render: (request) => (
                        <div>
                          <p className="font-medium">{LEAVE_TYPE_LABELS[request.requestType] ?? request.requestType}</p>
                          <p className="text-xs text-muted-foreground">{request.reason}</p>
                        </div>
                      ),
                    },
                    {
                      key: 'period',
                      header: 'Periodo',
                      render: (request) => (
                        <div>
                          <p>{formatDateTime(request.startAt)}</p>
                          <p className="text-muted-foreground">{formatDateTime(request.endAt)}</p>
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
                        request.status === 'PENDING' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={cancellingId === request.id}
                            onClick={() => void handleCancel(request.id)}
                          >
                            {cancellingId === request.id ? <Loader2 className="animate-spin size-4" /> : 'Cancelar'}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin acciones</span>
                        ),
                    },
                  ]}
                  rows={myRequests}
                  getRowKey={(request) => request.id}
                  emptyTitle="No hay solicitudes registradas"
                  emptyDescription="Tus solicitudes aparecerán aquí cuando las envíes."
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Nueva solicitud</CardTitle>
              <CardDescription>Registra un permiso o licencia indicando el rango solicitado.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="space-y-2">
                  <Label htmlFor="leave-type">Tipo</Label>
                  <Select
                    value={form.requestType}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, requestType: value }))
                    }
                  >
                    <SelectTrigger id="leave-type">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="leave-start-at">Inicio</Label>
                    <Input
                      id="leave-start-at"
                      type="datetime-local"
                      value={form.startAt}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, startAt: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leave-end-at">Fin</Label>
                    <Input
                      id="leave-end-at"
                      type="datetime-local"
                      value={form.endAt}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, endAt: event.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leave-reason">Motivo</Label>
                  <textarea
                    id="leave-reason"
                    className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.reason}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, reason: event.target.value }))
                    }
                    placeholder="Describe el motivo de la solicitud"
                    required
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

      {showTeamRequests ? (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Solicitudes del equipo</CardTitle>
            <CardDescription>Aprueba o rechaza solicitudes del personal de tu área.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="team-leaves-status">Estado</Label>
                <Select value={teamStatus} onValueChange={setTeamStatus}>
                  <SelectTrigger id="team-leaves-status">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="APPROVED">Aprobado</SelectItem>
                    <SelectItem value="REJECTED">Rechazado</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-leaves-start">Desde</Label>
                <Input
                  id="team-leaves-start"
                  type="date"
                  value={teamStartDate}
                  onChange={(event) => setTeamStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-leaves-end">Hasta</Label>
                <Input
                  id="team-leaves-end"
                  type="date"
                  value={teamEndDate}
                  onChange={(event) => setTeamEndDate(event.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Cargando solicitudes del equipo...
              </div>
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
                    key: 'request',
                    header: 'Solicitud',
                    render: (request) => (
                      <div>
                        <p>{LEAVE_TYPE_LABELS[request.requestType] ?? request.requestType}</p>
                        <p className="text-muted-foreground">{formatDateTime(request.startAt)}</p>
                        <p className="text-xs text-muted-foreground">{request.reason}</p>
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
                emptyDescription="Las solicitudes del personal de tu área aparecerán aquí."
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {showAllRequests ? (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Solicitudes globales</CardTitle>
            <CardDescription>Consulta consolidada para administración y RR. HH.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="all-leaves-status">Estado</Label>
                <Select value={allStatus} onValueChange={setAllStatus}>
                  <SelectTrigger id="all-leaves-status">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="APPROVED">Aprobado</SelectItem>
                    <SelectItem value="REJECTED">Rechazado</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="all-leaves-start">Desde</Label>
                <Input
                  id="all-leaves-start"
                  type="date"
                  value={allStartDate}
                  onChange={(event) => setAllStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="all-leaves-end">Hasta</Label>
                <Input
                  id="all-leaves-end"
                  type="date"
                  value={allEndDate}
                  onChange={(event) => setAllEndDate(event.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Cargando solicitudes globales...
              </div>
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
                        <p className="text-xs text-muted-foreground">{request.siteName}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'request',
                    header: 'Solicitud',
                    render: (request) => (
                      <div>
                        <p>{LEAVE_TYPE_LABELS[request.requestType] ?? request.requestType}</p>
                        <p className="text-muted-foreground">{formatDateTime(request.startAt)}</p>
                        <p className="text-xs text-muted-foreground">{request.reason}</p>
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
                      canReviewAll && request.status === 'PENDING' ? (
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
                emptyTitle="No hay solicitudes para mostrar"
                emptyDescription="La vista global se llenará cuando existan solicitudes registradas."
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {reviewTarget ? (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{reviewMode === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}</CardTitle>
            <CardDescription>
              {reviewTarget.employeeName} · {LEAVE_TYPE_LABELS[reviewTarget.requestType] ?? reviewTarget.requestType}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleReview}>
              <div className="space-y-2">
                <Label htmlFor="leave-review-comment">Comentario</Label>
                <textarea
                  id="leave-review-comment"
                  className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Escribe una observación sobre la decisión"
                  required
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button disabled={saving} type="submit">
                  {saving ? <Loader2 className="animate-spin" /> : null}
                  {reviewMode === 'approve' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
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
    </div>
  )
}
