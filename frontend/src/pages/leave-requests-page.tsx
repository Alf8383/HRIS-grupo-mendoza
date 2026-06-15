import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, Loader2, Plus, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import type { ColumnDef } from '@tanstack/react-table'
import { ConfirmDialog } from '@/components/app/confirm-dialog'
import { DataTable } from '@/components/app/data-table'
import { EntityDrawer, EntityDrawerActions } from '@/components/app/entity-drawer'
import { EmptyState } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { TableSkeleton } from '@/components/app/table-skeleton'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
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

const statusOptions = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'APPROVED', label: 'Aprobado' },
  { value: 'REJECTED', label: 'Rechazado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

export function LeaveRequestsPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''
  const roles = session?.user.roles ?? []
  const showOwnRequests = roles.some((role) => ['EMPLOYEE', 'MANAGER'].includes(role))
  const showTeamRequests = roles.includes('MANAGER')
  const showAllRequests = roles.some((role) => ['ADMIN', 'HR'].includes(role))
  const canReviewAll = roles.includes('ADMIN')

  const defaultTab = showOwnRequests ? 'own' : showTeamRequests ? 'team' : 'all'

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
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState<number | null>(null)

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
      setRequestDrawerOpen(false)
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
      setCancelConfirm(null)
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

  const openReview = (request: LeaveRequestRecord, mode: ReviewMode) => {
    setReviewTarget(request)
    setReviewMode(mode)
    setReviewComment('')
  }

  const ownColumns = useMemo<ColumnDef<LeaveRequestRecord>[]>(
    () => [
      {
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">
              {LEAVE_TYPE_LABELS[row.original.requestType] ?? row.original.requestType}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.reason}</p>
          </div>
        ),
      },
      {
        accessorKey: 'period',
        header: 'Periodo',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{formatDateTime(row.original.startAt)}</p>
            <p className="text-muted-foreground">{formatDateTime(row.original.endAt)}</p>
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
          row.original.status === 'PENDING' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={cancellingId === row.original.id}
              onClick={() => setCancelConfirm(row.original.id)}
            >
              {cancellingId === row.original.id ? <Loader2 className="size-4 animate-spin" /> : 'Cancelar'}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Sin acciones</span>
          ),
      },
    ],
    [cancellingId],
  )

  const teamColumns = useMemo<ColumnDef<LeaveRequestRecord>[]>(
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
        accessorKey: 'request',
        header: 'Solicitud',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{LEAVE_TYPE_LABELS[row.original.requestType] ?? row.original.requestType}</p>
            <p className="text-muted-foreground">{formatDateTime(row.original.startAt)}</p>
            <p className="text-xs text-muted-foreground">{row.original.reason}</p>
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

  const allColumns = useMemo<ColumnDef<LeaveRequestRecord>[]>(
    () => [
      {
        accessorKey: 'employee',
        header: 'Empleado',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.employeeName}</p>
            <p className="text-sm text-muted-foreground">{row.original.areaName}</p>
            <p className="text-xs text-muted-foreground">{row.original.siteName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'request',
        header: 'Solicitud',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{LEAVE_TYPE_LABELS[row.original.requestType] ?? row.original.requestType}</p>
            <p className="text-muted-foreground">{formatDateTime(row.original.startAt)}</p>
            <p className="text-xs text-muted-foreground">{row.original.reason}</p>
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
          canReviewAll && row.original.status === 'PENDING' ? (
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
    [canReviewAll],
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
        title="Permisos y licencias"
        description="Registra solicitudes, controla sus estados y gestiona aprobaciones según tu rol."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadRequests()}
            >
              <RefreshCcw />
              Actualizar
            </Button>
            {showOwnRequests && (
              <Button onClick={() => setRequestDrawerOpen(true)}>
                <Plus className="mr-1.5 size-4" />
                Nueva solicitud
              </Button>
            )}
          </div>
        }
      />

      {showOwnRequests || showTeamRequests || showAllRequests ? (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-4">
            {showOwnRequests && <TabsTrigger value="own">Mis solicitudes</TabsTrigger>}
            {showTeamRequests && <TabsTrigger value="team">Equipo</TabsTrigger>}
            {showAllRequests && <TabsTrigger value="all">Todas</TabsTrigger>}
          </TabsList>

          {showOwnRequests && (
            <TabsContent value="own">
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Mis solicitudes</CardTitle>
                  <CardDescription>Consulta tus solicitudes y sus estados.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderFilters(
                    myStatus,
                    setMyStatus,
                    myStartDate,
                    setMyStartDate,
                    myEndDate,
                    setMyEndDate,
                    'my-leaves',
                  )}

                  {loading ? (
                    <TableSkeleton rows={4} columns={4} />
                  ) : (
                    <DataTable
                      columns={ownColumns}
                      data={myRequests}
                      searchPlaceholder="Buscar solicitud..."
                      pageSize={10}
                      emptyState={
                        <EmptyState
                          icon={ClipboardList}
                          title="No hay solicitudes registradas"
                          description="Tus solicitudes aparecerán aquí cuando las envíes."
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

          {showTeamRequests && (
            <TabsContent value="team">
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Solicitudes del equipo</CardTitle>
                  <CardDescription>Aprueba o rechaza solicitudes del personal de tu área.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderFilters(
                    teamStatus,
                    setTeamStatus,
                    teamStartDate,
                    setTeamStartDate,
                    teamEndDate,
                    setTeamEndDate,
                    'team-leaves',
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
                          icon={ClipboardList}
                          title="No hay solicitudes del equipo"
                          description="Las solicitudes del personal de tu área aparecerán aquí."
                        />
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {showAllRequests && (
            <TabsContent value="all">
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Solicitudes globales</CardTitle>
                  <CardDescription>Consulta consolidada para administración y RR. HH.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderFilters(
                    allStatus,
                    setAllStatus,
                    allStartDate,
                    setAllStartDate,
                    allEndDate,
                    setAllEndDate,
                    'all-leaves',
                  )}

                  {loading ? (
                    <TableSkeleton rows={4} columns={4} />
                  ) : (
                    <DataTable
                      columns={allColumns}
                      data={allRequests}
                      searchPlaceholder="Buscar solicitud..."
                      pageSize={10}
                      emptyState={
                        <EmptyState
                          icon={ClipboardList}
                          title="No hay solicitudes para mostrar"
                          description="La vista global se llenará cuando existan solicitudes registradas."
                        />
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      ) : null}

      <EntityDrawer
        open={requestDrawerOpen}
        onOpenChange={setRequestDrawerOpen}
        title="Nueva solicitud"
        description="Registra un permiso o licencia indicando el rango solicitado."
        footer={
          <EntityDrawerActions
            onCancel={() => {
              setRequestDrawerOpen(false)
              setForm(initialForm)
            }}
            isLoading={saving}
            submitLabel="Enviar solicitud"
            form="leave-request-form"
          />
        }
      >
        <form id="leave-request-form" onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leave-type">Tipo</Label>
            <Select
              value={form.requestType}
              onValueChange={(value) => setForm((current) => ({ ...current, requestType: value }))}
            >
              <SelectTrigger id="leave-type" className="rounded-lg border-border/60">
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
                onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))}
                required
                className="rounded-lg border-border/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-end-at">Fin</Label>
              <Input
                id="leave-end-at"
                type="datetime-local"
                value={form.endAt}
                onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
                required
                className="rounded-lg border-border/60"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="leave-reason">Motivo</Label>
            <Textarea
              id="leave-reason"
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              placeholder="Describe el motivo de la solicitud"
              required
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
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReviewTarget(null)
            setReviewComment('')
          }
        }}
        title={reviewMode === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        description={
          reviewTarget
            ? `${reviewTarget.employeeName} · ${LEAVE_TYPE_LABELS[reviewTarget.requestType] ?? reviewTarget.requestType}`
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
            form="leave-review-form"
          />
        }
      >
        <form id="leave-review-form" onSubmit={handleReview} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leave-review-comment">Comentario</Label>
            <Textarea
              id="leave-review-comment"
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

      <ConfirmDialog
        open={cancelConfirm !== null}
        onOpenChange={() => setCancelConfirm(null)}
        title="Cancelar solicitud"
        description="¿Deseas cancelar esta solicitud? Esta acción no se puede deshacer."
        variant="destructive"
        confirmLabel="Cancelar solicitud"
        isLoading={cancellingId !== null}
        onConfirm={() => {
          if (cancelConfirm !== null) {
            void handleCancel(cancelConfirm)
          }
        }}
      />
    </div>
  )
}
