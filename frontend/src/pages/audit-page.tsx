import { useCallback, useEffect, useState } from 'react'
import { History, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/app/data-table'
import { PageHeader } from '@/components/app/page-header'
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
import { useAuth } from '@/contexts/auth-context'
import { formatDateTime } from '@/lib/format'
import { apiRequest, getApiMessage } from '@/lib/http'
import type { AuditLogRecord } from '@/types/domain'

export function AuditPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''

  const [logs, setLogs] = useState<AuditLogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadLogs = useCallback(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (userSearch.trim()) params.set('userSearch', userSearch.trim())
      if (moduleFilter.trim()) params.set('module', moduleFilter.trim().toUpperCase())
      if (actionFilter.trim()) params.set('action', actionFilter.trim().toUpperCase())
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const response = await apiRequest<AuditLogRecord[]>(
        `/audit-logs${params.size ? `?${params.toString()}` : ''}`,
        { token },
      )
      setLogs(response)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo cargar la bitácora.'))
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [actionFilter, endDate, moduleFilter, startDate, token, userSearch])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLogs()
  }, [loadLogs, token])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bitácora"
        description="Consulta acciones críticas registradas por usuario, módulo, acción y rango de fechas."
        actions={
          <Button type="button" variant="outline" onClick={() => void loadLogs()}>
            <RefreshCcw />
            Actualizar
          </Button>
        }
      />

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Refina la búsqueda para ubicar cambios y operaciones relevantes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="audit-user-search">Usuario</Label>
            <Input
              id="audit-user-search"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Correo o nombre parcial"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-module">Módulo</Label>
            <Input
              id="audit-module"
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              placeholder="USER, EMPLOYEE, ATTENDANCE..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-action">Acción</Label>
            <Input
              id="audit-action"
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              placeholder="CREATE, UPDATE, APPROVE..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-start">Desde</Label>
            <Input
              id="audit-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-end">Hasta</Label>
            <Input
              id="audit-end"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Registros</CardTitle>
          <CardDescription>
            Trazabilidad de operaciones de negocio registradas de forma no bloqueante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : (
            <DataTable
              columns={[
                {
                  key: 'eventAt',
                  header: 'Fecha y hora',
                  render: (row) => formatDateTime(row.eventAt),
                },
                {
                  key: 'user',
                  header: 'Usuario',
                  render: (row) => (
                    <div>
                      <p className="font-medium">{row.userEmail || 'Sin usuario'}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {row.userId ?? 'N/D'}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'module',
                  header: 'Módulo',
                  render: (row) => row.module,
                },
                {
                  key: 'action',
                  header: 'Acción',
                  render: (row) => row.action,
                },
                {
                  key: 'entity',
                  header: 'Entidad',
                  render: (row) => (
                    <div>
                      <p>{row.entityType}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {row.entityId ?? 'N/D'}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'summary',
                  header: 'Resumen',
                  render: (row) => (
                    <p className="max-w-xl text-sm text-muted-foreground">{row.summary}</p>
                  ),
                },
              ]}
              rows={logs}
              getRowKey={(row) => row.id}
              emptyTitle="Sin registros"
              emptyDescription="No hay eventos que coincidan con los filtros seleccionados."
              emptyIcon={History}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
