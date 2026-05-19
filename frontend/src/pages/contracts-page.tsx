import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileBadge2, Loader2, PencilLine, Plus, RefreshCcw, RotateCcw } from 'lucide-react'
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
  ContractRecord,
  EmployeeRecord,
  ExpiringContractItem,
} from '@/types/domain'

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  FIXED_TERM: 'Plazo fijo',
  INDEFINITE: 'Indefinido',
  TEMPORARY: 'Temporal',
  INTERNSHIP: 'Prácticas',
}

const initialForm = {
  employeeId: '',
  contractType: 'FIXED_TERM',
  startDate: '',
  endDate: '',
  status: 'ACTIVE',
  notes: '',
}

type FormMode = 'create' | 'edit' | 'renew'

export function ContractsPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''

  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('ALL')
  const [contracts, setContracts] = useState<ContractRecord[]>([])
  const [expiringContracts, setExpiringContracts] = useState<ExpiringContractItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingContractId, setEditingContractId] = useState<number | null>(null)
  const [form, setForm] = useState(initialForm)

  const loadEmployees = useCallback(async () => {
    if (!token) {
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
  }, [token])

  const loadContracts = useCallback(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    try {
      const tasks: Promise<void>[] = [
        apiRequest<ExpiringContractItem[]>('/contracts/expiring', { token }).then(
          setExpiringContracts,
        ),
      ]

      if (selectedEmployeeId !== 'ALL') {
        tasks.push(
          apiRequest<ContractRecord[]>(
            `/contracts/employee/${selectedEmployeeId}`,
            { token },
          ).then(setContracts),
        )
      } else {
        setContracts([])
      }

      await Promise.all(tasks)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudieron cargar los contratos.'))
    } finally {
      setLoading(false)
    }
  }, [selectedEmployeeId, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEmployees()
  }, [loadEmployees, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadContracts()
  }, [loadContracts, token])

  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee.id) === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId],
  )

  const handleSelectedEmployeeChange = (value: string) => {
    setSelectedEmployeeId(value)
    if (formMode === 'create') {
      setForm((current) => ({
        ...current,
        employeeId: value === 'ALL' ? '' : value,
      }))
    }
  }

  const resetForm = () => {
    setFormMode('create')
    setEditingContractId(null)
    setForm({
      ...initialForm,
      employeeId: selectedEmployeeId !== 'ALL' ? selectedEmployeeId : '',
    })
  }

  const startEdit = (contract: ContractRecord) => {
    setFormMode('edit')
    setEditingContractId(contract.id)
    setForm({
      employeeId: String(contract.employeeId),
      contractType: contract.contractType,
      startDate: contract.startDate,
      endDate: contract.endDate ?? '',
      status: contract.status,
      notes: contract.notes ?? '',
    })
  }

  const startRenew = (contract: ContractRecord) => {
    setFormMode('renew')
    setEditingContractId(contract.id)
    setForm({
      employeeId: String(contract.employeeId),
      contractType: contract.contractType,
      startDate: '',
      endDate: '',
      status: 'ACTIVE',
      notes: '',
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        employeeId: Number(form.employeeId),
        contractType: form.contractType,
        startDate: form.startDate,
        endDate: form.endDate || null,
        status: form.status,
        notes: form.notes || null,
      }

      if (formMode === 'edit' && editingContractId) {
        await apiRequest(`/contracts/${editingContractId}`, {
          method: 'PUT',
          token,
          body: JSON.stringify({
            contractType: payload.contractType,
            startDate: payload.startDate,
            endDate: payload.endDate,
            status: payload.status,
            notes: payload.notes,
          }),
        })
        toast.success('Contrato actualizado.')
      } else if (formMode === 'renew' && editingContractId) {
        await apiRequest(`/contracts/${editingContractId}/renew`, {
          method: 'POST',
          token,
          body: JSON.stringify({
            contractType: payload.contractType,
            startDate: payload.startDate,
            endDate: payload.endDate,
            status: payload.status,
            notes: payload.notes,
          }),
        })
        toast.success('Contrato renovado.')
      } else {
        await apiRequest('/contracts', {
          method: 'POST',
          token,
          body: JSON.stringify(payload),
        })
        toast.success('Contrato registrado.')
      }

      resetForm()
      await loadContracts()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo guardar el contrato.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contratos"
        description="Registra contratos, consulta historial y controla vencimientos próximos."
        actions={
          <Button type="button" variant="outline" onClick={() => void loadContracts()}>
            <RefreshCcw />
            Actualizar
          </Button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,420px)]">
        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Contratos por vencer</CardTitle>
              <CardDescription>
                Alertas de contratos activos con vencimiento en los próximos 30 días.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={4} columns={4} />
              ) : (
                <DataTable
                  columns={[
                    {
                      key: 'employee',
                      header: 'Empleado',
                      render: (contract) => (
                        <div>
                          <p className="font-medium">{contract.employeeName}</p>
                          <p className="text-muted-foreground">{contract.areaName}</p>
                          <p className="text-xs text-muted-foreground">
                            {contract.positionName}
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'type',
                      header: 'Contrato',
                      render: (contract) => (
                        <div>
                          <p>{CONTRACT_TYPE_LABELS[contract.contractType] ?? contract.contractType}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {formatDate(contract.endDate)}
                          </p>
                        </div>
                      ),
                    },
                    {
                      key: 'days',
                      header: 'Plazo',
                      render: (contract) => (
                        <span className="text-sm text-muted-foreground">
                          {contract.daysUntilExpiration} día(s)
                        </span>
                      ),
                    },
                  ]}
                  rows={expiringContracts}
                  getRowKey={(contract) => contract.id}
                  emptyTitle="No hay contratos por vencer"
                  emptyDescription="Las alertas aparecerán aquí cuando existan vencimientos próximos."
                  emptyIcon={FileBadge2}
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader className="gap-4">
              <div className="space-y-2">
                <Label htmlFor="contracts-employee-filter">Empleado</Label>
                <Select
                  value={selectedEmployeeId}
                  onValueChange={handleSelectedEmployeeChange}
                >
                  <SelectTrigger id="contracts-employee-filter">
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
            </CardHeader>
            <CardContent>
              {selectedEmployee ? (
                loading ? (
                  <TableSkeleton rows={4} columns={4} />
                ) : (
                  <DataTable
                    columns={[
                      {
                        key: 'type',
                        header: 'Contrato',
                        render: (contract) => (
                          <div>
                            <p className="font-medium">
                              {CONTRACT_TYPE_LABELS[contract.contractType] ?? contract.contractType}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Inicio: {formatDate(contract.startDate)}
                            </p>
                          </div>
                        ),
                      },
                      {
                        key: 'period',
                        header: 'Vigencia',
                        render: (contract) => (
                          <div>
                            <p>
                              {formatDate(contract.startDate)} -{' '}
                              {contract.endDate ? formatDate(contract.endDate) : 'Sin fecha fin'}
                            </p>
                            {contract.previousContractId ? (
                              <p className="text-xs text-muted-foreground">
                                Renovación de #{contract.previousContractId}
                              </p>
                            ) : null}
                          </div>
                        ),
                      },
                      {
                        key: 'status',
                        header: 'Estado',
                        render: (contract) => <StatusBadge value={contract.status} />,
                      },
                      {
                        key: 'actions',
                        header: 'Acciones',
                        render: (contract) => (
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(contract)}>
                              <PencilLine />
                              Editar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => startRenew(contract)}>
                              <RotateCcw />
                              Renovar
                            </Button>
                          </div>
                        ),
                      },
                    ]}
                    rows={contracts}
                    getRowKey={(contract) => contract.id}
                    emptyTitle="Sin contratos registrados"
                    emptyDescription="Selecciona un empleado y registra su primer contrato."
                    emptyIcon={FileBadge2}
                  />
                )
              ) : (
                <EmptyState
                  title="Selecciona un empleado"
                  description="Al elegir un colaborador verás su historial contractual aquí."
                  icon={FileBadge2}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>
              {formMode === 'edit'
                ? 'Editar contrato'
                : formMode === 'renew'
                  ? 'Renovar contrato'
                  : 'Nuevo contrato'}
            </CardTitle>
            <CardDescription>
              {formMode === 'renew'
                ? 'La renovación crea un nuevo contrato sin perder el historial.'
                : 'Registra la vigencia contractual del empleado seleccionado.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="contract-employee">Empleado</Label>
                <Select
                  value={form.employeeId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, employeeId: value }))
                  }
                  disabled={formMode !== 'create'}
                >
                  <SelectTrigger id="contract-employee">
                    <SelectValue placeholder="Selecciona un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={String(employee.id)}>
                        {employee.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-type">Tipo</Label>
                <Select
                  value={form.contractType}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, contractType: value }))
                  }
                >
                  <SelectTrigger id="contract-type">
                    <SelectValue placeholder="Tipo de contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contract-start-date">Fecha de inicio</Label>
                  <Input
                    id="contract-start-date"
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, startDate: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract-end-date">Fecha de fin</Label>
                  <Input
                    id="contract-end-date"
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, endDate: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-status">Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, status: value }))
                  }
                >
                  <SelectTrigger id="contract-status">
                    <SelectValue placeholder="Estado del contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="EXPIRED">Vencido</SelectItem>
                    <SelectItem value="TERMINATED">Terminado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-notes">Notas</Label>
                <Textarea
                  id="contract-notes"
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Detalles relevantes del contrato"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={saving || !form.employeeId || !form.startDate}
                  type="submit"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Plus />}
                  {formMode === 'edit'
                    ? 'Guardar cambios'
                    : formMode === 'renew'
                      ? 'Registrar renovación'
                      : 'Registrar contrato'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <RefreshCcw />
                  Limpiar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
