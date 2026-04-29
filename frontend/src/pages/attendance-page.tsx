import { useCallback, useEffect, useState } from 'react'
import { CalendarCheck2, CheckCircle2, Clock3, ClipboardList, Loader2, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { formatDate, formatTime } from '@/lib/format'
import { apiRequest, getApiMessage } from '@/lib/http'
import type {
  AttendanceRecord,
  AttendanceSummaryItem,
  EmployeeRecord,
  TodayAttendance,
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
  source: null,
  notes: null,
  justificationNote: null,
  justifiedByName: null,
  justifiedAt: null,
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
  const [justificationTarget, setJustificationTarget] = useState<AttendanceSummaryItem | null>(null)
  const [justificationNote, setJustificationNote] = useState('')
  const [loadingSelf, setLoadingSelf] = useState(showSelfService)
  const [loadingSummary, setLoadingSummary] = useState(showSummary)
  const [submitting, setSubmitting] = useState(false)
  const [closingDay, setClosingDay] = useState(false)

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Asistencia"
        description="Consulta la jornada diaria, controla inasistencias y revisa el historial operativo según tu rol."
        actions={
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
        }
      />

      {showSelfService ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <Card className="rounded-3xl">
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance-history-end">Hasta</Label>
                  <Input
                    id="attendance-history-end"
                    type="date"
                    value={historyEndDate}
                    onChange={(event) => setHistoryEndDate(event.target.value)}
                  />
                </div>
              </div>

              {loadingSelf ? (
                <TableSkeleton rows={5} columns={4} />
              ) : history.length ? (
                <div className="overflow-hidden rounded-2xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">Fecha</th>
                        <th className="px-4 py-3 font-medium">Entrada</th>
                        <th className="px-4 py-3 font-medium">Salida</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((record) => (
                        <tr key={record.id} className="border-t hover:bg-muted/30">
                          <td className="px-4 py-3">{formatDate(record.attendanceDate)}</td>
                          <td className="px-4 py-3">{formatTime(record.checkInAt)}</td>
                          <td className="px-4 py-3">{formatTime(record.checkOutAt)}</td>
                          <td className="px-4 py-3">
                            <div className="space-y-2">
                              <StatusBadge value={record.status} />
                              {record.lateMinutes ? (
                                <p className="text-xs text-muted-foreground">
                                  {record.lateMinutes} min de tardanza
                                </p>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No hay registros en el periodo"
                  description="Cuando registres asistencia, tu historial aparecerá aquí."
                  icon={ClipboardList}
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Mi jornada de hoy</CardTitle>
              <CardDescription>Registra tu entrada y salida del día.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">{formatDate(today.attendanceDate)}</p>
                  </div>
                  {today.status ? <StatusBadge value={today.status} /> : <StatusBadge value="PENDING" />}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Entrada</p>
                    <p className="mt-2 text-lg font-semibold">{formatTime(today.checkInAt)}</p>
                  </div>
                  <div className="rounded-2xl border bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Salida</p>
                    <p className="mt-2 text-lg font-semibold">{formatTime(today.checkOutAt)}</p>
                  </div>
                </div>
                {today.justificationNote ? (
                  <div className="mt-4 rounded-2xl border border-dashed bg-background p-4">
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
          <Card className="rounded-3xl">
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance-summary-end">Hasta</Label>
                  <Input
                    id="attendance-summary-end"
                    type="date"
                    value={summaryEndDate}
                    onChange={(event) => setSummaryEndDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance-summary-status">Estado</Label>
                  <Select value={summaryStatus} onValueChange={setSummaryStatus}>
                    <SelectTrigger id="attendance-summary-status">
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
                      <SelectTrigger id="attendance-summary-employee">
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
                <div className="rounded-2xl border bg-muted/30 p-4">
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
                        />
                      </div>
                      <Button type="button" disabled={closingDay} onClick={handleCloseDay}>
                        {closingDay ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                        Ejecutar cierre
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {loadingSummary ? (
                <TableSkeleton rows={5} columns={5} />
              ) : summary.length ? (
                <div className="overflow-hidden rounded-2xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">Empleado</th>
                        <th className="px-4 py-3 font-medium">Fecha</th>
                        <th className="px-4 py-3 font-medium">Marcación</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                        <th className="px-4 py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((item) => (
                        <tr key={item.id} className="border-t hover:bg-muted/30">
                          <td className="px-4 py-3 align-top">
                            <p className="font-medium">{item.employeeName}</p>
                            <p className="text-muted-foreground">{item.positionName}</p>
                            <p className="text-xs text-muted-foreground">{item.areaName} · {item.siteName}</p>
                          </td>
                          <td className="px-4 py-3 align-top">{formatDate(item.attendanceDate)}</td>
                          <td className="px-4 py-3 align-top">
                            <p>Entrada: {formatTime(item.checkInAt)}</p>
                            <p className="text-muted-foreground">Salida: {formatTime(item.checkOutAt)}</p>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-2">
                              <StatusBadge value={item.status} />
                              {item.lateMinutes ? (
                                <p className="text-xs text-muted-foreground">
                                  {item.lateMinutes} min de tardanza
                                </p>
                              ) : null}
                              {item.justificationNote ? (
                                <p className="text-xs text-muted-foreground">{item.justificationNote}</p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            {canJustify && ['LATE', 'ABSENT'].includes(item.status) ? (
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
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin acciones</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No hay registros para mostrar"
                  description="Ajusta los filtros o espera nuevas marcaciones para ver resultados aquí."
                  icon={ClipboardList}
                />
              )}
            </CardContent>
          </Card>

          {justificationTarget ? (
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Justificar registro</CardTitle>
                <CardDescription>
                  {justificationTarget.employeeName} · {formatDate(justificationTarget.attendanceDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={submitJustification}>
                  <div className="space-y-2">
                    <Label htmlFor="attendance-justification-note">Motivo</Label>
                    <Textarea
                      id="attendance-justification-note"
                      value={justificationNote}
                      onChange={(event) => setJustificationNote(event.target.value)}
                      placeholder="Describe el motivo de la justificación"
                      required
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled={submitting} type="submit">
                      {submitting ? <Loader2 className="animate-spin" /> : null}
                      Guardar justificación
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setJustificationTarget(null)
                        setJustificationNote('')
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
