import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
  Hourglass,
  Percent,
  Upload,
  TimerReset,
  Trophy,
  TriangleAlert,
  UserX,
  Loader2,
  RefreshCcw,
} from 'lucide-react'
import { toast } from 'sonner'

import type { ColumnDef } from '@tanstack/react-table'
import { ConfirmDialog } from '@/components/app/confirm-dialog'
import { DataTable } from '@/components/app/data-table'
import { EntityDrawer, EntityDrawerActions } from '@/components/app/entity-drawer'
import { EmptyState } from '@/components/app/empty-state'
import { MetricCard } from '@/components/app/metric-card'
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
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { formatDate, formatTime } from '@/lib/format'
import { apiRequest, getApiMessage } from '@/lib/http'
import type {
  AttendanceRecord,
  AttendanceSummaryItem,
  EmployeeRecord,
  TodayAttendance,
  ZktecoImportResult,
} from '@/types/domain'

const SELF_SERVICE_ROLES = ['EMPLOYEE', 'MANAGER']
const SUMMARY_ROLES = ['ADMIN', 'HR', 'MANAGER']
const JUSTIFICATION_ROLES = ['ADMIN', 'HR']

const emptyToday: TodayAttendance = {
  attendanceDate: new Date().toISOString().slice(0, 10),
  recorded: false,
  id: null,
  checkInAt: null,
  checkOutAt: null,
  status: null,
  lateMinutes: null,
  workedMinutes: null,
  extraMinutes: null,
  source: null,
  notes: null,
  justificationNote: null,
  justifiedByName: null,
  justifiedAt: null,
}

type RankedKpi = {
  value: string
  description: string
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

function topEmployeeByStatus(items: AttendanceSummaryItem[], statuses: string[]): RankedKpi {
  const counts = new Map<string, number>()

  items
    .filter((item) => statuses.includes(item.status))
    .forEach((item) => {
      counts.set(item.employeeName, (counts.get(item.employeeName) ?? 0) + 1)
    })

  const top = Array.from(counts.entries()).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]

  return top
    ? { value: `${top[1]} caso(s)`, description: top[0] }
    : { value: '0 caso(s)', description: 'Sin datos en el periodo' }
}

function topDayByAbsences(items: AttendanceSummaryItem[], absentStatuses: string[]): RankedKpi {
  const counts = new Map<string, number>()

  items
    .filter((item) => absentStatuses.includes(item.status))
    .forEach((item) => {
      counts.set(item.attendanceDate, (counts.get(item.attendanceDate) ?? 0) + 1)
    })

  const top = Array.from(counts.entries()).sort((left, right) => right[1] - left[1] || right[0].localeCompare(left[0]))[0]

  return top
    ? { value: `${top[1]} falta(s)`, description: formatDate(top[0]) }
    : { value: '0 falta(s)', description: 'Sin ausencias en el periodo' }
}

export function AttendancePage() {
  const { session } = useAuth()
  const token = session?.token ?? ''
  const roles = session?.user.roles ?? []
  const showSelfService = roles.some((role) => SELF_SERVICE_ROLES.includes(role))
  const showSummary = roles.some((role) => SUMMARY_ROLES.includes(role))
  const canJustify = roles.some((role) => JUSTIFICATION_ROLES.includes(role))
  const canCloseDay = canJustify
  const isGlobalView = roles.some((role) => ['ADMIN', 'HR'].includes(role))

  const [today, setToday] = useState<TodayAttendance>(emptyToday)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<AttendanceSummaryItem[]>([])
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [historyStartDate, setHistoryStartDate] = useState('')
  const [historyEndDate, setHistoryEndDate] = useState('')
  const [summaryStartDate, setSummaryStartDate] = useState('')
  const [summaryEndDate, setSummaryEndDate] = useState('')
  const [summaryStatus, setSummaryStatus] = useState('ALL')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('ALL')
  const [attendanceNote, setAttendanceNote] = useState('')
  const [closeDayDate, setCloseDayDate] = useState(new Date().toISOString().slice(0, 10))
  const [closeDayConfirmOpen, setCloseDayConfirmOpen] = useState(false)
  const [justificationTarget, setJustificationTarget] = useState<AttendanceSummaryItem | null>(null)
  const [justificationNote, setJustificationNote] = useState('')
  const [zktecoImportOpen, setZktecoImportOpen] = useState(false)
  const [zktecoFile, setZktecoFile] = useState<File | null>(null)
  const [zktecoImportResult, setZktecoImportResult] = useState<ZktecoImportResult | null>(null)
  const [loadingSelf, setLoadingSelf] = useState(showSelfService)
  const [loadingSummary, setLoadingSummary] = useState(showSummary)
  const [submitting, setSubmitting] = useState(false)
  const [closingDay, setClosingDay] = useState(false)
  const [importingZkteco, setImportingZkteco] = useState(false)

  const loadEmployees = useCallback(async () => {
    if (!token || !isGlobalView) {
      return
    }

    try {
      const response = await apiRequest<EmployeeRecord[]>('/employees?status=ACTIVE', { token })
      setEmployees(response)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo cargar la lista de empleados.'))
    }
  }, [isGlobalView, token])

  const loadSelfData = useCallback(async () => {
    if (!token || !showSelfService) {
      return
    }

    setLoadingSelf(true)
    try {
      const historyParams = new URLSearchParams()
      if (historyStartDate) historyParams.set('startDate', historyStartDate)
      if (historyEndDate) historyParams.set('endDate', historyEndDate)

      const [todayResponse, historyResponse] = await Promise.all([
        apiRequest<TodayAttendance>('/attendance/me/today', { token }),
        apiRequest<AttendanceRecord[]>(
          `/attendance/me/history${historyParams.size ? `?${historyParams.toString()}` : ''}`,
          { token },
        ),
      ])

      setToday(todayResponse)
      setHistory(historyResponse)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo cargar tu asistencia.'))
      setToday(emptyToday)
      setHistory([])
    } finally {
      setLoadingSelf(false)
    }
  }, [historyEndDate, historyStartDate, showSelfService, token])

  const loadSummary = useCallback(async () => {
    if (!token || !showSummary) {
      return
    }

    setLoadingSummary(true)
    try {
      const params = new URLSearchParams()
      if (summaryStartDate) params.set('startDate', summaryStartDate)
      if (summaryEndDate) params.set('endDate', summaryEndDate)
      if (summaryStatus !== 'ALL') params.set('status', summaryStatus)
      if (selectedEmployeeId !== 'ALL') params.set('employeeId', selectedEmployeeId)

      const response = await apiRequest<AttendanceSummaryItem[]>(
        `/attendance/summary${params.size ? `?${params.toString()}` : ''}`,
        { token },
      )
      setSummary(response)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo cargar el resumen de asistencia.'))
      setSummary([])
    } finally {
      setLoadingSummary(false)
    }
  }, [selectedEmployeeId, showSummary, summaryEndDate, summaryStartDate, summaryStatus, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEmployees()
  }, [loadEmployees, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSelfData()
  }, [loadSelfData, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSummary()
  }, [loadSummary, token])

  const handleAttendanceAction = async (path: '/attendance/check-in' | '/attendance/check-out') => {
    setSubmitting(true)
    try {
      await apiRequest(path, {
        method: 'POST',
        token,
        body: JSON.stringify({ notes: attendanceNote || null }),
      })
      setAttendanceNote('')
      toast.success(path.endsWith('check-in') ? 'Entrada registrada.' : 'Salida registrada.')
      await loadSelfData()
      if (showSummary) {
        await loadSummary()
      }
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo registrar la marcación.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseDay = async () => {
    setClosingDay(true)
    try {
      const response = await apiRequest<AttendanceSummaryItem[]>('/attendance/close-day', {
        method: 'POST',
        token,
        body: JSON.stringify({ attendanceDate: closeDayDate }),
      })
      toast.success(
        response.length
          ? `Cierre diario completado. ${response.length} inasistencia(s) generada(s).`
          : 'El cierre diario no generó nuevas inasistencias.',
      )
      await loadSummary()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo ejecutar el cierre diario.'))
    } finally {
      setClosingDay(false)
      setCloseDayConfirmOpen(false)
    }
  }

  const submitZktecoImport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!zktecoFile) {
      toast.error('Selecciona un archivo Excel de ZKTECO.')
      return
    }

    const formData = new FormData()
    formData.append('file', zktecoFile)
    setImportingZkteco(true)

    try {
      const response = await apiRequest<ZktecoImportResult>('/attendance/imports/zkteco', {
        method: 'POST',
        token,
        body: formData,
      })
      setZktecoImportResult(response)
      toast.success('Importación ZKTECO completada.')
      await Promise.all([loadEmployees(), loadSummary()])
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo importar el archivo ZKTECO.'))
    } finally {
      setImportingZkteco(false)
    }
  }

  const submitJustification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!justificationTarget) return

    setSubmitting(true)
    try {
      await apiRequest(`/attendance/${justificationTarget.id}/justify`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ justificationNote }),
      })
      toast.success('Registro justificado correctamente.')
      setJustificationTarget(null)
      setJustificationNote('')
      await loadSummary()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo justificar el registro.'))
    } finally {
      setSubmitting(false)
    }
  }

  const allowCheckIn = !today.recorded || !today.checkInAt
  const allowCheckOut = Boolean(today.recorded && today.checkInAt && !today.checkOutAt)

  const summaryKpis = useMemo(() => {
    const total = summary.length
    const absentStatuses = ['ABSENT', 'JUSTIFIED_ABSENT']
    const lateStatuses = ['LATE', 'JUSTIFIED_LATE']
    const presentCount = summary.filter((item) => !absentStatuses.includes(item.status)).length
    const punctualCount = summary.filter((item) => item.status === 'PRESENT').length
    const lateCount = summary.filter((item) => lateStatuses.includes(item.status)).length
    const absentCount = summary.filter((item) => absentStatuses.includes(item.status)).length
    const lateRecords = summary.filter((item) => item.lateMinutes > 0)
    const averageLateMinutes = lateRecords.length
      ? Math.round(
          lateRecords.reduce((totalMinutes, item) => totalMinutes + item.lateMinutes, 0)
          / lateRecords.length,
        )
      : 0
    const attendanceRate = total ? Math.round((presentCount / total) * 100) : 0
    const punctualityRate = total ? Math.round((punctualCount / total) * 100) : 0
    const absenteeismRate = total ? Math.round((absentCount / total) * 100) : 0
    const workedMinutes = summary.reduce((minutes, item) => minutes + (item.workedMinutes ?? 0), 0)
    const extraMinutes = summary.reduce((minutes, item) => minutes + (item.extraMinutes ?? 0), 0)
    const topLateEmployee = topEmployeeByStatus(summary, lateStatuses)
    const topAbsentEmployee = topEmployeeByStatus(summary, absentStatuses)
    const topAbsentDay = topDayByAbsences(summary, absentStatuses)

    return {
      total,
      presentCount,
      punctualCount,
      lateCount,
      absentCount,
      averageLateMinutes,
      attendanceRate,
      punctualityRate,
      absenteeismRate,
      workedMinutes,
      extraMinutes,
      topLateEmployee,
      topAbsentEmployee,
      topAbsentDay,
    }
  }, [summary])

  const historyColumns = useMemo<ColumnDef<AttendanceRecord>[]>(
    () => [
      {
        accessorKey: 'attendanceDate',
        header: 'Fecha',
        cell: ({ row }) => formatDate(row.original.attendanceDate),
      },
      {
        accessorKey: 'checkInAt',
        header: 'Entrada',
        cell: ({ row }) => formatTime(row.original.checkInAt),
      },
      {
        accessorKey: 'checkOutAt',
        header: 'Salida',
        cell: ({ row }) => formatTime(row.original.checkOutAt),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => (
          <div className="space-y-1">
            <StatusBadge value={row.original.status} />
            {row.original.lateMinutes ? (
              <p className="text-xs text-muted-foreground">{row.original.lateMinutes} min de tardanza</p>
            ) : null}
          </div>
        ),
      },
    ],
    [],
  )

  const summaryColumns = useMemo<ColumnDef<AttendanceSummaryItem>[]>(
    () => [
      {
        accessorKey: 'employeeName',
        header: 'Empleado',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.employeeName}</p>
            <p className="text-sm text-muted-foreground">{row.original.positionName}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.areaName} · {row.original.siteName}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'attendanceDate',
        header: 'Fecha',
        cell: ({ row }) => formatDate(row.original.attendanceDate),
      },
      {
        accessorKey: 'checkInAt',
        header: 'Marcación',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>Entrada: {formatTime(row.original.checkInAt)}</p>
            <p className="text-muted-foreground">Salida: {formatTime(row.original.checkOutAt)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => (
          <div className="space-y-1">
            <StatusBadge value={row.original.status} />
            {row.original.lateMinutes ? (
              <p className="text-xs text-muted-foreground">{row.original.lateMinutes} min de tardanza</p>
            ) : null}
            {row.original.justificationNote ? (
              <p className="text-xs text-muted-foreground">{row.original.justificationNote}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
          const item = row.original
          if (canJustify && ['LATE', 'ABSENT'].includes(item.status)) {
            return (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setJustificationTarget(item)
                  setJustificationNote(item.justificationNote ?? '')
                }}
              >
                Justificar
              </Button>
            )
          }
          return <span className="text-xs text-muted-foreground">Sin acciones</span>
        },
      },
    ],
    [canJustify],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Asistencia"
        description="Consulta la jornada diaria, controla inasistencias y revisa el historial operativo según tu rol."
        actions={
          <div className="flex flex-wrap gap-2">
            {canJustify ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setZktecoImportOpen(true)
                  setZktecoImportResult(null)
                }}
              >
                <FileSpreadsheet />
                Importar ZKTECO
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await Promise.all([loadSelfData(), loadSummary()])
              }}
            >
              <RefreshCcw />
              Actualizar
            </Button>
          </div>
        }
      />

      {showSelfService ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Mi historial</CardTitle>
              <CardDescription>Revisa tus registros por rango de fechas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="attendance-history-start">Desde</Label>
                  <Input
                    id="attendance-history-start"
                    type="date"
                    value={historyStartDate}
                    onChange={(event) => setHistoryStartDate(event.target.value)}
                    className="rounded-lg border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance-history-end">Hasta</Label>
                  <Input
                    id="attendance-history-end"
                    type="date"
                    value={historyEndDate}
                    onChange={(event) => setHistoryEndDate(event.target.value)}
                    className="rounded-lg border-border/60"
                  />
                </div>
              </div>

              {loadingSelf ? (
                <TableSkeleton rows={5} columns={4} />
              ) : (
                <DataTable
                  columns={historyColumns}
                  data={history}
                  searchPlaceholder="Buscar en historial..."
                  pageSize={10}
                  emptyState={
                    <EmptyState
                      icon={ClipboardList}
                      title="No hay registros en el periodo"
                      description="Cuando registres asistencia, tu historial aparecerá aquí."
                    />
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Mi jornada de hoy</CardTitle>
              <CardDescription>Registra tu entrada y salida del día.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">{formatDate(today.attendanceDate)}</p>
                  </div>
                  {today.status ? <StatusBadge value={today.status} /> : <StatusBadge value="PENDING" />}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Entrada</p>
                    <p className="mt-2 text-lg font-semibold">{formatTime(today.checkInAt)}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Salida</p>
                    <p className="mt-2 text-lg font-semibold">{formatTime(today.checkOutAt)}</p>
                  </div>
                </div>
                {today.justificationNote ? (
                  <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-background p-4">
                    <p className="text-sm font-medium">Justificación registrada</p>
                    <p className="mt-1 text-sm text-muted-foreground">{today.justificationNote}</p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendance-note">Observación opcional</Label>
                <Input
                  id="attendance-note"
                  value={attendanceNote}
                  onChange={(event) => setAttendanceNote(event.target.value)}
                  placeholder="Comentario breve de la marcación"
                  className="rounded-lg border-border/60"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  disabled={!allowCheckIn || submitting}
                  onClick={() => handleAttendanceAction('/attendance/check-in')}
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <CalendarCheck2 />}
                  Registrar entrada
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!allowCheckOut || submitting}
                  onClick={() => handleAttendanceAction('/attendance/check-out')}
                >
                  <Clock3 />
                  Registrar salida
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {showSummary ? (
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Horas trabajadas"
              value={formatMinutes(summaryKpis.workedMinutes)}
              description="Total importado desde marcaciones"
              icon={Hourglass}
            />
            <MetricCard
              title="Horas extra"
              value={formatMinutes(summaryKpis.extraMinutes)}
              description="Tiempo adicional registrado"
              icon={Clock3}
            />
            <MetricCard
              title="Promedio tardanza"
              value={`${summaryKpis.averageLateMinutes} min`}
              description={`${summaryKpis.lateCount} tardanza(s)`}
              icon={TimerReset}
            />
            <MetricCard
              title="Top tardanzas"
              value={summaryKpis.topLateEmployee.value}
              description={summaryKpis.topLateEmployee.description}
              icon={Trophy}
            />
            <MetricCard
              title="Top faltas"
              value={summaryKpis.topAbsentEmployee.value}
              description={summaryKpis.topAbsentEmployee.description}
              icon={UserX}
            />
            <MetricCard
              title="Puntualidad"
              value={`${summaryKpis.punctualityRate}%`}
              description={`${summaryKpis.punctualCount} registro(s) puntuales`}
              icon={Percent}
            />
            <MetricCard
              title="Ausentismo"
              value={`${summaryKpis.absenteeismRate}%`}
              description={`${summaryKpis.absentCount} inasistencia(s)`}
              icon={TriangleAlert}
            />
            <MetricCard
              title="Día crítico"
              value={summaryKpis.topAbsentDay.value}
              description={summaryKpis.topAbsentDay.description}
              icon={CalendarDays}
            />
          </div>

          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>{isGlobalView ? 'Resumen global' : 'Resumen del equipo'}</CardTitle>
              <CardDescription>
                {isGlobalView
                  ? 'Consulta asistencia consolidada, justifica observaciones y ejecuta el cierre diario.'
                  : 'Revisa la asistencia del equipo asociado a tu área.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[repeat(4,minmax(0,1fr))]">
                <div className="space-y-2">
                  <Label htmlFor="attendance-summary-start">Desde</Label>
                  <Input
                    id="attendance-summary-start"
                    type="date"
                    value={summaryStartDate}
                    onChange={(event) => setSummaryStartDate(event.target.value)}
                    className="rounded-lg border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance-summary-end">Hasta</Label>
                  <Input
                    id="attendance-summary-end"
                    type="date"
                    value={summaryEndDate}
                    onChange={(event) => setSummaryEndDate(event.target.value)}
                    className="rounded-lg border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance-summary-status">Estado</Label>
                  <Select value={summaryStatus} onValueChange={setSummaryStatus}>
                    <SelectTrigger id="attendance-summary-status" className="rounded-lg border-border/60">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="PRESENT">Presente</SelectItem>
                      <SelectItem value="LATE">Tardanza</SelectItem>
                      <SelectItem value="ABSENT">Inasistencia</SelectItem>
                      <SelectItem value="JUSTIFIED_LATE">Tardanza justificada</SelectItem>
                      <SelectItem value="JUSTIFIED_ABSENT">Inasistencia justificada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isGlobalView ? (
                  <div className="space-y-2">
                    <Label htmlFor="attendance-summary-employee">Empleado</Label>
                    <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                      <SelectTrigger id="attendance-summary-employee" className="rounded-lg border-border/60">
                        <SelectValue placeholder="Empleado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={String(employee.id)}>
                            {employee.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>

              {canCloseDay ? (
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Cierre diario</p>
                      <p className="text-sm text-muted-foreground">
                        Genera inasistencias para empleados activos sin marcación en la fecha seleccionada.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="attendance-close-day">Fecha</Label>
                        <Input
                          id="attendance-close-day"
                          type="date"
                          value={closeDayDate}
                          onChange={(event) => setCloseDayDate(event.target.value)}
                          className="rounded-lg border-border/60"
                        />
                      </div>
                      <Button type="button" disabled={closingDay} onClick={() => setCloseDayConfirmOpen(true)}>
                        {closingDay ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                        Ejecutar cierre
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {loadingSummary ? (
                <TableSkeleton rows={5} columns={5} />
              ) : (
                <DataTable
                  columns={summaryColumns}
                  data={summary}
                  searchPlaceholder="Buscar en resumen..."
                  pageSize={10}
                  emptyState={
                    <EmptyState
                      icon={ClipboardList}
                      title="No hay registros para mostrar"
                      description="Ajusta los filtros o espera nuevas marcaciones para ver resultados aquí."
                    />
                  }
                />
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <EntityDrawer
        open={zktecoImportOpen}
        onOpenChange={(open) => {
          setZktecoImportOpen(open)
          if (!open) {
            setZktecoFile(null)
            setZktecoImportResult(null)
          }
        }}
        title="Importar ZKTECO"
        description="Carga registros de asistencia desde Excel y crea trabajadores faltantes con código biométrico."
        footer={
          <EntityDrawerActions
            onCancel={() => setZktecoImportOpen(false)}
            isLoading={importingZkteco}
            submitLabel="Importar archivo"
            form="zkteco-import-form"
          />
        }
      >
        <form id="zkteco-import-form" onSubmit={submitZktecoImport} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="zkteco-file">Archivo Excel</Label>
            <Input
              id="zkteco-file"
              type="file"
              accept=".xlsx,.xls"
              disabled={importingZkteco}
              onChange={(event) => {
                setZktecoFile(event.target.files?.[0] ?? null)
                setZktecoImportResult(null)
              }}
              className="rounded-lg border-border/60"
            />
          </div>

          {importingZkteco ? (
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Procesando archivo...
            </div>
          ) : null}

          {zktecoImportResult ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Filas leídas</p>
                  <p className="mt-2 text-2xl font-semibold">{zktecoImportResult.rowsRead}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Trabajadores creados</p>
                  <p className="mt-2 text-2xl font-semibold">{zktecoImportResult.employeesCreated}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Asistencias creadas</p>
                  <p className="mt-2 text-2xl font-semibold">{zktecoImportResult.attendanceCreated}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Actualizadas</p>
                  <p className="mt-2 text-2xl font-semibold">{zktecoImportResult.attendanceUpdated}</p>
                </div>
              </div>

              {zktecoImportResult.errors.length ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm font-medium text-destructive">
                    {zktecoImportResult.rowsSkipped} fila(s) omitida(s)
                  </p>
                  <div className="mt-3 max-h-40 space-y-2 overflow-auto text-sm text-muted-foreground">
                    {zktecoImportResult.errors.map((error) => (
                      <p key={`${error.rowNumber}-${error.message}`}>
                        Fila {error.rowNumber}: {error.message}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <Upload className="size-4" />
                  Todas las filas válidas fueron procesadas.
                </div>
              )}
            </div>
          ) : null}
        </form>
      </EntityDrawer>

      <EntityDrawer
        open={justificationTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setJustificationTarget(null)
            setJustificationNote('')
          }
        }}
        title="Justificar registro"
        description={
          justificationTarget
            ? `${justificationTarget.employeeName} · ${formatDate(justificationTarget.attendanceDate)}`
            : ''
        }
        footer={
          <EntityDrawerActions
            onCancel={() => {
              setJustificationTarget(null)
              setJustificationNote('')
            }}
            isLoading={submitting}
            submitLabel="Guardar justificación"
            form="attendance-justification-form"
          />
        }
      >
        <form id="attendance-justification-form" onSubmit={submitJustification} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="attendance-justification-note">Motivo</Label>
            <Textarea
              id="attendance-justification-note"
              value={justificationNote}
              onChange={(event) => setJustificationNote(event.target.value)}
              placeholder="Describe el motivo de la justificación"
              required
              className="rounded-lg border-border/60"
            />
          </div>
          {submitting && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Guardando...
            </div>
          )}
        </form>
      </EntityDrawer>

      <ConfirmDialog
        open={closeDayConfirmOpen}
        onOpenChange={setCloseDayConfirmOpen}
        title="Ejecutar cierre diario"
        description={`Se generarán inasistencias para empleados activos sin marcación el ${formatDate(closeDayDate)}. ¿Deseas continuar?`}
        confirmLabel="Ejecutar cierre"
        isLoading={closingDay}
        onConfirm={handleCloseDay}
      />
    </div>
  )
}
