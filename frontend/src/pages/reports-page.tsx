import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  FileBadge2,
  FileSpreadsheet,
  Loader2,
  Percent,
  RefreshCcw,
  TimerReset,
  TriangleAlert,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/app/data-table'
import { MetricCard } from '@/components/app/metric-card'
import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { TableSkeleton } from '@/components/app/table-skeleton'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { formatDate, formatDateTime, formatTime } from '@/lib/format'
import { apiRequest, downloadApiFile, getApiMessage } from '@/lib/http'
import { getRoleLabel } from '@/lib/roles'
import type {
  Area,
  AttendanceReportRow,
  EmployeeRecord,
  EmployeeReportRow,
  ExpiringContractReportRow,
  Position,
  RequestReportRow,
  Site,
} from '@/types/domain'

type ReportKey = 'employees' | 'attendance' | 'requests' | 'contracts'

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  FIXED_TERM: 'Plazo fijo',
  INDEFINITE: 'Indefinido',
  TEMPORARY: 'Temporal',
  INTERNSHIP: 'Prácticas',
}

const REQUEST_GROUP_LABELS: Record<string, string> = {
  LEAVE: 'Permisos y licencias',
  VACATION: 'Vacaciones',
}

export function ReportsPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''
  const roles = session?.user.roles ?? []
  const isManagerOnly = roles.includes('MANAGER') && !roles.includes('ADMIN') && !roles.includes('HR')
  const canViewEmployeeReports = roles.some((role) => ['ADMIN', 'HR'].includes(role))
  const canViewContractReports = roles.some((role) => ['ADMIN', 'HR'].includes(role))

  const tabs = useMemo(() => {
    const nextTabs: Array<{
      key: ReportKey
      label: string
      icon: typeof Users
    }> = []

    if (canViewEmployeeReports) {
      nextTabs.push({
        key: 'employees',
        label: 'Empleados',
        icon: Users,
      })
    }

    nextTabs.push(
      {
        key: 'attendance',
        label: 'Asistencia',
        icon: CalendarClock,
      },
      {
        key: 'requests',
        label: 'Solicitudes',
        icon: ClipboardList,
      },
    )

    if (canViewContractReports) {
      nextTabs.push({
        key: 'contracts',
        label: 'Contratos por vencer',
        icon: FileBadge2,
      })
    }

    return nextTabs
  }, [canViewContractReports, canViewEmployeeReports])

  const [activeTab, setActiveTab] = useState<ReportKey>(
    canViewEmployeeReports ? 'employees' : 'attendance',
  )
  const [areas, setAreas] = useState<Area[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])

  const [employeeRows, setEmployeeRows] = useState<EmployeeReportRow[]>([])
  const [attendanceRows, setAttendanceRows] = useState<AttendanceReportRow[]>([])
  const [requestRows, setRequestRows] = useState<RequestReportRow[]>([])
  const [contractRows, setContractRows] = useState<ExpiringContractReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeeStatus, setEmployeeStatus] = useState('ALL')
  const [employeeSiteId, setEmployeeSiteId] = useState('ALL')
  const [employeeAreaId, setEmployeeAreaId] = useState('ALL')
  const [employeePositionId, setEmployeePositionId] = useState('ALL')

  const [attendanceStartDate, setAttendanceStartDate] = useState('')
  const [attendanceEndDate, setAttendanceEndDate] = useState('')
  const [attendanceStatus, setAttendanceStatus] = useState('ALL')
  const [attendanceEmployeeId, setAttendanceEmployeeId] = useState('ALL')
  const [attendanceSiteId, setAttendanceSiteId] = useState('ALL')
  const [attendanceAreaId, setAttendanceAreaId] = useState('ALL')

  const [requestStartDate, setRequestStartDate] = useState('')
  const [requestEndDate, setRequestEndDate] = useState('')
  const [requestStatus, setRequestStatus] = useState('ALL')
  const [requestGroup, setRequestGroup] = useState('ALL')
  const [requestEmployeeId, setRequestEmployeeId] = useState('ALL')

  const [contractThresholdDays, setContractThresholdDays] = useState('30')
  const [contractSiteId, setContractSiteId] = useState('ALL')
  const [contractAreaId, setContractAreaId] = useState('ALL')

  const loadCatalogs = useCallback(async () => {
    if (!token || isManagerOnly) {
      return
    }

    try {
      const [areaData, siteData, positionData, employeeData] = await Promise.all([
        apiRequest<Area[]>('/areas?status=ACTIVE', { token }),
        apiRequest<Site[]>('/sites?status=ACTIVE', { token }),
        apiRequest<Position[]>('/positions?status=ACTIVE', { token }),
        apiRequest<EmployeeRecord[]>('/employees?status=ACTIVE', { token }),
      ])

      setAreas(areaData)
      setSites(siteData)
      setPositions(positionData)
      setEmployees(employeeData)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudieron cargar los filtros de reportes.'))
    }
  }, [isManagerOnly, token])

  const buildEmployeeQuery = useCallback(() => {
    const params = new URLSearchParams()
    if (employeeSearch.trim()) params.set('search', employeeSearch.trim())
    if (employeeStatus !== 'ALL') params.set('status', employeeStatus)
    if (employeeSiteId !== 'ALL') params.set('siteId', employeeSiteId)
    if (employeeAreaId !== 'ALL') params.set('areaId', employeeAreaId)
    if (employeePositionId !== 'ALL') params.set('positionId', employeePositionId)
    return `/reports/employees${params.size ? `?${params.toString()}` : ''}`
  }, [employeeAreaId, employeePositionId, employeeSearch, employeeSiteId, employeeStatus])

  const buildAttendanceQuery = useCallback(() => {
    const params = new URLSearchParams()
    if (attendanceStartDate) params.set('startDate', attendanceStartDate)
    if (attendanceEndDate) params.set('endDate', attendanceEndDate)
    if (attendanceStatus !== 'ALL') params.set('status', attendanceStatus)
    if (!isManagerOnly && attendanceEmployeeId !== 'ALL') {
      params.set('employeeId', attendanceEmployeeId)
    }
    if (!isManagerOnly && attendanceSiteId !== 'ALL') params.set('siteId', attendanceSiteId)
    if (!isManagerOnly && attendanceAreaId !== 'ALL') params.set('areaId', attendanceAreaId)
    return `/reports/attendance${params.size ? `?${params.toString()}` : ''}`
  }, [
    attendanceAreaId,
    attendanceEmployeeId,
    attendanceEndDate,
    attendanceSiteId,
    attendanceStartDate,
    attendanceStatus,
    isManagerOnly,
  ])

  const buildRequestQuery = useCallback(() => {
    const params = new URLSearchParams()
    if (requestStartDate) params.set('startDate', requestStartDate)
    if (requestEndDate) params.set('endDate', requestEndDate)
    if (requestStatus !== 'ALL') params.set('requestStatus', requestStatus)
    if (requestGroup !== 'ALL') params.set('requestGroup', requestGroup)
    if (!isManagerOnly && requestEmployeeId !== 'ALL') params.set('employeeId', requestEmployeeId)
    return `/reports/requests${params.size ? `?${params.toString()}` : ''}`
  }, [isManagerOnly, requestEmployeeId, requestEndDate, requestGroup, requestStartDate, requestStatus])

  const buildContractQuery = useCallback(() => {
    const params = new URLSearchParams()
    if (contractThresholdDays.trim()) params.set('thresholdDays', contractThresholdDays.trim())
    if (contractSiteId !== 'ALL') params.set('siteId', contractSiteId)
    if (contractAreaId !== 'ALL') params.set('areaId', contractAreaId)
    return `/reports/contracts/expiring${params.size ? `?${params.toString()}` : ''}`
  }, [contractAreaId, contractSiteId, contractThresholdDays])

  const buildExportPath = useCallback(() => {
    const [basePath, query = ''] =
      activeTab === 'employees'
        ? buildEmployeeQuery().split('?')
        : activeTab === 'attendance'
          ? buildAttendanceQuery().split('?')
          : activeTab === 'requests'
            ? buildRequestQuery().split('?')
            : buildContractQuery().split('?')

    return `${basePath}/export${query ? `?${query}` : ''}`
  }, [activeTab, buildAttendanceQuery, buildContractQuery, buildEmployeeQuery, buildRequestQuery])

  const loadReport = useCallback(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    try {
      if (activeTab === 'employees') {
        setEmployeeRows(await apiRequest<EmployeeReportRow[]>(buildEmployeeQuery(), { token }))
      }

      if (activeTab === 'attendance') {
        setAttendanceRows(await apiRequest<AttendanceReportRow[]>(buildAttendanceQuery(), { token }))
      }

      if (activeTab === 'requests') {
        setRequestRows(await apiRequest<RequestReportRow[]>(buildRequestQuery(), { token }))
      }

      if (activeTab === 'contracts') {
        setContractRows(await apiRequest<ExpiringContractReportRow[]>(buildContractQuery(), { token }))
      }
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo cargar el reporte solicitado.'))
      setEmployeeRows([])
      setAttendanceRows([])
      setRequestRows([])
      setContractRows([])
    } finally {
      setLoading(false)
    }
  }, [
    activeTab,
    buildAttendanceQuery,
    buildContractQuery,
    buildEmployeeQuery,
    buildRequestQuery,
    token,
  ])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCatalogs()
  }, [loadCatalogs, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReport()
  }, [loadReport, token])

  const handleExport = async () => {
    if (!token) {
      return
    }

    setExporting(true)
    try {
      await downloadApiFile(buildExportPath(), { token })
      toast.success('Exportación generada correctamente.')
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo exportar el reporte.'))
    } finally {
      setExporting(false)
    }
  }

  const currentDescription = {
    employees: 'Consulta la dotación filtrada por estructura, estado y búsqueda libre.',
    attendance: 'Revisa marcaciones e incidencias por rango de fechas y estado.',
    requests: 'Consolida permisos, licencias y vacaciones en una sola consulta.',
    contracts: 'Identifica contratos activos con vencimiento próximo.',
  }[activeTab]

  const reportKpis = useMemo(() => {
    if (activeTab === 'employees') {
      const activeCount = employeeRows.filter((row) => row.employeeStatus === 'ACTIVE').length
      const inactiveCount = employeeRows.filter((row) => row.employeeStatus === 'INACTIVE').length
      const areaCount = new Set(employeeRows.map((row) => row.areaName)).size

      return [
        {
          title: 'Total empleados',
          value: employeeRows.length,
          description: 'Resultados con los filtros actuales',
          icon: Users,
        },
        {
          title: 'Activos',
          value: activeCount,
          description: 'Colaboradores habilitados',
          icon: UserCheck,
        },
        {
          title: 'Inactivos',
          value: inactiveCount,
          description: 'Registros fuera de operación',
          icon: UserX,
        },
        {
          title: 'Áreas',
          value: areaCount,
          description: 'Áreas representadas en el reporte',
          icon: Building2,
        },
      ]
    }

    if (activeTab === 'attendance') {
      const absentStatuses = ['ABSENT', 'JUSTIFIED_ABSENT']
      const lateStatuses = ['LATE', 'JUSTIFIED_LATE']
      const presentCount = attendanceRows.filter((row) => !absentStatuses.includes(row.status)).length
      const lateCount = attendanceRows.filter((row) => lateStatuses.includes(row.status)).length
      const absentCount = attendanceRows.filter((row) => absentStatuses.includes(row.status)).length
      const lateRows = attendanceRows.filter((row) => (row.lateMinutes ?? 0) > 0)
      const averageLateMinutes = lateRows.length
        ? Math.round(
            lateRows.reduce((total, row) => total + (row.lateMinutes ?? 0), 0)
            / lateRows.length,
          )
        : 0
      const attendanceRate = attendanceRows.length
        ? Math.round((presentCount / attendanceRows.length) * 100)
        : 0

      return [
        {
          title: 'Tasa de asistencia',
          value: `${attendanceRate}%`,
          description: `${presentCount} de ${attendanceRows.length} registro(s)`,
          icon: Percent,
        },
        {
          title: 'Presentes',
          value: presentCount,
          description: 'Incluye tardanzas justificadas y no justificadas',
          icon: UserCheck,
        },
        {
          title: 'Tardanzas',
          value: lateCount,
          description: `${averageLateMinutes} min promedio`,
          icon: TimerReset,
        },
        {
          title: 'Inasistencias',
          value: absentCount,
          description: 'Ausencias justificadas y pendientes',
          icon: TriangleAlert,
        },
      ]
    }

    if (activeTab === 'requests') {
      const pendingCount = requestRows.filter((row) => row.requestStatus === 'PENDING').length
      const approvedCount = requestRows.filter((row) => row.requestStatus === 'APPROVED').length
      const rejectedOrCancelledCount = requestRows.filter((row) =>
        ['REJECTED', 'CANCELLED'].includes(row.requestStatus),
      ).length
      const vacationCount = requestRows.filter((row) => row.sourceGroup === 'VACATION').length

      return [
        {
          title: 'Total solicitudes',
          value: requestRows.length,
          description: 'Permisos, licencias y vacaciones',
          icon: ClipboardList,
        },
        {
          title: 'Pendientes',
          value: pendingCount,
          description: 'Requieren revisión',
          icon: CalendarClock,
        },
        {
          title: 'Aprobadas',
          value: approvedCount,
          description: 'Solicitudes aceptadas',
          icon: CheckCircle2,
        },
        {
          title: 'Vacaciones',
          value: vacationCount,
          description: `${rejectedOrCancelledCount} rechazada(s) o cancelada(s)`,
          icon: FileSpreadsheet,
        },
      ]
    }

    const urgentCount = contractRows.filter((row) => row.daysUntilExpiration <= 7).length
    const averageDays = contractRows.length
      ? Math.round(
          contractRows.reduce((total, row) => total + row.daysUntilExpiration, 0)
          / contractRows.length,
        )
      : 0
    const fixedTermCount = contractRows.filter((row) => row.contractType === 'FIXED_TERM').length
    const areaCount = new Set(contractRows.map((row) => row.areaName)).size

    return [
      {
        title: 'Por vencer',
        value: contractRows.length,
        description: `Dentro de ${contractThresholdDays || '0'} día(s)`,
        icon: FileBadge2,
      },
      {
        title: 'Urgentes',
        value: urgentCount,
        description: 'Vencen en 7 días o menos',
        icon: TriangleAlert,
      },
      {
        title: 'Días promedio',
        value: averageDays,
        description: 'Hasta la fecha de vencimiento',
        icon: CalendarClock,
      },
      {
        title: 'Plazo fijo',
        value: fixedTermCount,
        description: `${areaCount} área(s) involucrada(s)`,
        icon: FileSpreadsheet,
      },
    ]
  }, [activeTab, attendanceRows, contractRows, contractThresholdDays, employeeRows, requestRows])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reportes"
        description="Consulta información operativa consolidada y exporta los resultados a Excel según tu alcance de acceso."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => void loadReport()}>
              <RefreshCcw />
              Actualizar
            </Button>
            <Button type="button" onClick={() => void handleExport()} disabled={exporting}>
              {exporting ? <Loader2 className="animate-spin" /> : <Download />}
              Exportar Excel
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportKey)}>
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="gap-4">
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key}>
                  <tab.icon />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div>
              <CardTitle>
                {tabs.find((tab) => tab.key === activeTab)?.label ?? 'Reporte'}
              </CardTitle>
              <CardDescription>{currentDescription}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeTab === 'employees' ? (
              <div className="grid gap-4 xl:grid-cols-5">
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="report-employees-search">Buscar</Label>
                  <Input
                    id="report-employees-search"
                    value={employeeSearch}
                    onChange={(event) => setEmployeeSearch(event.target.value)}
                    placeholder="Nombre, correo o DNI"
                    className="rounded-lg border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-employees-status">Estado</Label>
                  <Select value={employeeStatus} onValueChange={setEmployeeStatus}>
                    <SelectTrigger
                      id="report-employees-status"
                      className="h-9 rounded-lg border-border/60"
                    >
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="ACTIVE">Activos</SelectItem>
                      <SelectItem value="INACTIVE">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-employees-site">Sede</Label>
                  <Select value={employeeSiteId} onValueChange={setEmployeeSiteId}>
                    <SelectTrigger
                      id="report-employees-site"
                      className="h-9 rounded-lg border-border/60"
                    >
                      <SelectValue placeholder="Sede" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas</SelectItem>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={String(site.id)}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-employees-area">Área</Label>
                  <Select value={employeeAreaId} onValueChange={setEmployeeAreaId}>
                    <SelectTrigger
                      id="report-employees-area"
                      className="h-9 rounded-lg border-border/60"
                    >
                      <SelectValue placeholder="Área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas</SelectItem>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={String(area.id)}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-employees-position">Cargo</Label>
                  <Select value={employeePositionId} onValueChange={setEmployeePositionId}>
                    <SelectTrigger
                      id="report-employees-position"
                      className="h-9 rounded-lg border-border/60"
                    >
                      <SelectValue placeholder="Cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={String(position.id)}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {activeTab === 'attendance' ? (
              <div className="grid gap-4 xl:grid-cols-6">
                <div className="space-y-2">
                  <Label htmlFor="report-attendance-start">Desde</Label>
                  <Input
                    id="report-attendance-start"
                    type="date"
                    value={attendanceStartDate}
                    onChange={(event) => setAttendanceStartDate(event.target.value)}
                    className="rounded-lg border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-attendance-end">Hasta</Label>
                  <Input
                    id="report-attendance-end"
                    type="date"
                    value={attendanceEndDate}
                    onChange={(event) => setAttendanceEndDate(event.target.value)}
                    className="rounded-lg border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-attendance-status">Estado</Label>
                  <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                    <SelectTrigger
                      id="report-attendance-status"
                      className="h-9 rounded-lg border-border/60"
                    >
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
                {!isManagerOnly ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="report-attendance-employee">Empleado</Label>
                      <Select value={attendanceEmployeeId} onValueChange={setAttendanceEmployeeId}>
                        <SelectTrigger
                          id="report-attendance-employee"
                          className="h-9 rounded-lg border-border/60"
                        >
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
                    <div className="space-y-2">
                      <Label htmlFor="report-attendance-site">Sede</Label>
                      <Select value={attendanceSiteId} onValueChange={setAttendanceSiteId}>
                        <SelectTrigger
                          id="report-attendance-site"
                          className="h-9 rounded-lg border-border/60"
                        >
                          <SelectValue placeholder="Sede" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todas</SelectItem>
                          {sites.map((site) => (
                            <SelectItem key={site.id} value={String(site.id)}>
                              {site.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="report-attendance-area">Área</Label>
                      <Select value={attendanceAreaId} onValueChange={setAttendanceAreaId}>
                        <SelectTrigger
                          id="report-attendance-area"
                          className="h-9 rounded-lg border-border/60"
                        >
                          <SelectValue placeholder="Área" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todas</SelectItem>
                          {areas.map((area) => (
                            <SelectItem key={area.id} value={String(area.id)}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            {activeTab === 'requests' ? (
              <div className="grid gap-4 xl:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="report-requests-start">Desde</Label>
                  <Input
                    id="report-requests-start"
                    type="date"
                    value={requestStartDate}
                    onChange={(event) => setRequestStartDate(event.target.value)}
                    className="rounded-lg border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-requests-end">Hasta</Label>
                  <Input
                    id="report-requests-end"
                    type="date"
                    value={requestEndDate}
                    onChange={(event) => setRequestEndDate(event.target.value)}
                    className="rounded-lg border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-requests-status">Estado</Label>
                  <Select value={requestStatus} onValueChange={setRequestStatus}>
                    <SelectTrigger
                      id="report-requests-status"
                      className="h-9 rounded-lg border-border/60"
                    >
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
                  <Label htmlFor="report-requests-group">Grupo</Label>
                  <Select value={requestGroup} onValueChange={setRequestGroup}>
                    <SelectTrigger
                      id="report-requests-group"
                      className="h-9 rounded-lg border-border/60"
                    >
                      <SelectValue placeholder="Grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="LEAVE">Permisos y licencias</SelectItem>
                      <SelectItem value="VACATION">Vacaciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!isManagerOnly ? (
                  <div className="space-y-2">
                    <Label htmlFor="report-requests-employee">Empleado</Label>
                    <Select value={requestEmployeeId} onValueChange={setRequestEmployeeId}>
                      <SelectTrigger
                        id="report-requests-employee"
                        className="h-9 rounded-lg border-border/60"
                      >
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
            ) : null}

            {activeTab === 'contracts' ? (
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="report-contracts-threshold">Umbral de días</Label>
                  <Input
                    id="report-contracts-threshold"
                    type="number"
                    min="1"
                    value={contractThresholdDays}
                    onChange={(event) => setContractThresholdDays(event.target.value)}
                    className="rounded-lg border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-contracts-site">Sede</Label>
                  <Select value={contractSiteId} onValueChange={setContractSiteId}>
                    <SelectTrigger
                      id="report-contracts-site"
                      className="h-9 rounded-lg border-border/60"
                    >
                      <SelectValue placeholder="Sede" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas</SelectItem>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={String(site.id)}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-contracts-area">Área</Label>
                  <Select value={contractAreaId} onValueChange={setContractAreaId}>
                    <SelectTrigger
                      id="report-contracts-area"
                      className="h-9 rounded-lg border-border/60"
                    >
                      <SelectValue placeholder="Área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas</SelectItem>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={String(area.id)}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {reportKpis.map((kpi) => (
                <MetricCard
                  key={kpi.title}
                  title={kpi.title}
                  value={kpi.value}
                  description={kpi.description}
                  icon={kpi.icon}
                />
              ))}
            </div>

            {loading ? (
              <TableSkeleton rows={6} columns={5} />
            ) : activeTab === 'employees' ? (
              <DataTable
                columns={[
                  {
                    key: 'employee',
                    header: 'Empleado',
                    render: (row) => (
                      <div>
                        <p className="font-medium">{row.fullName}</p>
                        <p className="text-muted-foreground">{row.email}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'role',
                    header: 'Rol',
                    render: (row) => getRoleLabel(row.role),
                  },
                  {
                    key: 'organization',
                    header: 'Estructura',
                    render: (row) => (
                      <div>
                        <p>{row.areaName}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.positionName} · {row.siteName}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: 'hireDate',
                    header: 'Ingreso',
                    render: (row) => formatDate(row.hireDate),
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: (row) => <StatusBadge value={row.employeeStatus} />,
                  },
                ]}
                rows={employeeRows}
                getRowKey={(row) => row.employeeId}
                emptyTitle="Sin resultados"
                emptyDescription="No se encontraron empleados con los filtros seleccionados."
                emptyIcon={Users}
              />
            ) : activeTab === 'attendance' ? (
              <DataTable
                columns={[
                  {
                    key: 'employee',
                    header: 'Empleado',
                    render: (row) => (
                      <div>
                        <p className="font-medium">{row.employeeName}</p>
                        <p className="text-muted-foreground">{row.employeeEmail}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'organization',
                    header: 'Estructura',
                    render: (row) => (
                      <div>
                        <p>{row.areaName}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.positionName} · {row.siteName}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: 'marking',
                    header: 'Marcación',
                    render: (row) => (
                      <div>
                        <p>{formatDate(row.attendanceDate)}</p>
                        <p className="text-xs text-muted-foreground">
                          Entrada: {formatTime(row.checkInAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Salida: {formatTime(row.checkOutAt)}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: (row) => (
                      <div className="space-y-2">
                        <StatusBadge value={row.status} />
                        {row.lateMinutes ? (
                          <p className="text-xs text-muted-foreground">
                            {row.lateMinutes} min
                          </p>
                        ) : null}
                      </div>
                    ),
                  },
                  {
                    key: 'detail',
                    header: 'Detalle',
                    render: (row) => (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {row.notes || row.justificationNote || 'Sin observaciones'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Origen: {row.source}
                        </p>
                      </div>
                    ),
                  },
                ]}
                rows={attendanceRows}
                getRowKey={(row) => row.recordId}
                emptyTitle="Sin registros"
                emptyDescription="No hay marcaciones para el rango o filtros elegidos."
                emptyIcon={CalendarClock}
              />
            ) : activeTab === 'requests' ? (
              <DataTable
                columns={[
                  {
                    key: 'employee',
                    header: 'Empleado',
                    render: (row) => (
                      <div>
                        <p className="font-medium">{row.employeeName}</p>
                        <p className="text-muted-foreground">{row.employeeEmail}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'group',
                    header: 'Grupo',
                    render: (row) => (
                      <div>
                        <p>{REQUEST_GROUP_LABELS[row.sourceGroup] ?? row.sourceGroup}</p>
                        <p className="text-xs text-muted-foreground">{row.requestType}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'period',
                    header: 'Periodo',
                    render: (row) => (
                      <div>
                        <p>{row.startValue}</p>
                        <p className="text-xs text-muted-foreground">{row.endValue}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: (row) => <StatusBadge value={row.requestStatus} />,
                  },
                  {
                    key: 'detail',
                    header: 'Detalle',
                    render: (row) => (
                      <div>
                        <p className="text-sm">{row.reasonOrObservation || 'Sin detalle'}</p>
                        <p className="text-xs text-muted-foreground">
                          Creado: {formatDateTime(row.createdAt)}
                        </p>
                      </div>
                    ),
                  },
                ]}
                rows={requestRows}
                getRowKey={(row) => `${row.sourceGroup}-${row.requestId}`}
                emptyTitle="Sin solicitudes"
                emptyDescription="No se encontraron solicitudes con los filtros aplicados."
                emptyIcon={ClipboardList}
              />
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'employee',
                    header: 'Empleado',
                    render: (row) => (
                      <div>
                        <p className="font-medium">{row.employeeName}</p>
                        <p className="text-muted-foreground">{row.employeeEmail}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'organization',
                    header: 'Estructura',
                    render: (row) => (
                      <div>
                        <p>{row.areaName}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.positionName} · {row.siteName}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: 'contract',
                    header: 'Contrato',
                    render: (row) => (
                      <div>
                        <p>{CONTRACT_TYPE_LABELS[row.contractType] ?? row.contractType}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(row.startDate)} - {formatDate(row.endDate)}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: (row) => <StatusBadge value={row.status} />,
                  },
                  {
                    key: 'days',
                    header: 'Vencimiento',
                    render: (row) => (
                      <div>
                        <p>{formatDate(row.endDate)}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.daysUntilExpiration} día(s)
                        </p>
                      </div>
                    ),
                  },
                ]}
                rows={contractRows}
                getRowKey={(row) => row.contractId}
                emptyTitle="Sin vencimientos"
                emptyDescription="No existen contratos activos dentro del umbral seleccionado."
                emptyIcon={FileBadge2}
              />
            )}
          </CardContent>
        </Card>
      </Tabs>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Alcance actual</CardTitle>
          <CardDescription>
            Este módulo respeta el rol de la sesión y limita los datos visibles al alcance autorizado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Badge key={role} variant="outline">
              <FileSpreadsheet className="size-3" />
              {getRoleLabel(role)}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
