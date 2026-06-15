import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronsUpDown,
  Download,
  FileBadge2,
  FileText,
  Loader2,
  PencilLine,
  Plus,
  RefreshCcw,
  RotateCcw,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/app/confirm-dialog'
import { DataTable } from '@/components/app/data-table'
import { EmptyState } from '@/components/app/empty-state'
import { EntityDrawer } from '@/components/app/entity-drawer'
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import { apiRequest, downloadApiBlob, getApiMessage } from '@/lib/http'
import { cn } from '@/lib/utils'
import type {
  ContractDocumentRecord,
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmRenew, setConfirmRenew] = useState<ContractRecord | null>(null)
  const [documentTarget, setDocumentTarget] = useState<ContractRecord | null>(null)
  const [documents, setDocuments] = useState<ContractDocumentRecord[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false)

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

  const selectedFormEmployee = useMemo(
    () => employees.find((employee) => String(employee.id) === form.employeeId) ?? null,
    [employees, form.employeeId],
  )

  const handleSelectedEmployeeChange = (value: string) => {
    setSelectedEmployeeId(value)
    if (formMode === 'create' && drawerOpen) {
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

  const openCreate = () => {
    resetForm()
    setDrawerOpen(true)
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
    setDrawerOpen(true)
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
    setDrawerOpen(true)
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

      setDrawerOpen(false)
      resetForm()
      await loadContracts()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo guardar el contrato.'))
    } finally {
      setSaving(false)
    }
  }

  const loadDocuments = useCallback(async (contractId: number) => {
    if (!token) {
      return
    }

    setLoadingDocuments(true)
    try {
      const response = await apiRequest<ContractDocumentRecord[]>(
        `/contracts/${contractId}/documents`,
        { token },
      )
      setDocuments(response)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudieron cargar los documentos.'))
      setDocuments([])
    } finally {
      setLoadingDocuments(false)
    }
  }, [token])

  const openDocuments = async (contract: ContractRecord) => {
    setDocumentTarget(contract)
    await loadDocuments(contract.id)
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !documentTarget) {
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    setUploadingDocument(true)

    try {
      await apiRequest<ContractDocumentRecord>(
        `/contracts/${documentTarget.id}/documents`,
        {
          method: 'POST',
          token,
          body: formData,
        },
      )
      toast.success('Documento cargado.')
      await Promise.all([loadDocuments(documentTarget.id), loadContracts()])
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo cargar el documento.'))
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleDocumentDownload = async (document: ContractDocumentRecord) => {
    if (!documentTarget) {
      return
    }

    try {
      await downloadApiBlob(
        `/contracts/${documentTarget.id}/documents/${document.id}/download`,
        { token },
      )
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo descargar el documento.'))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filteredEmployees = useMemo(() => {
    const term = employeeSearch.trim().toLowerCase()
    if (!term) return employees
    return employees.filter((employee) =>
      employee.fullName.toLowerCase().includes(term),
    )
  }, [employees, employeeSearch])

  const drawerTitle =
    formMode === 'edit'
      ? 'Editar contrato'
      : formMode === 'renew'
        ? 'Renovar contrato'
        : 'Nuevo contrato'

  const drawerDescription =
    formMode === 'renew'
      ? 'La renovación crea un nuevo contrato sin perder el historial.'
      : 'Registra la vigencia contractual del empleado seleccionado.'

  const submitLabel =
    formMode === 'edit'
      ? 'Guardar cambios'
      : formMode === 'renew'
        ? 'Registrar renovación'
        : 'Registrar contrato'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contratos"
        description="Registra contratos, consulta historial y controla vencimientos próximos."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => void loadContracts()}>
              <RefreshCcw />
              Actualizar
            </Button>
            <Button type="button" onClick={openCreate}>
              <Plus />
              Nuevo contrato
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        <Card className="rounded-2xl border-border/60 shadow-sm">
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

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="gap-4">
            <div className="space-y-2">
              <Label htmlFor="contracts-employee-filter">Empleado</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={handleSelectedEmployeeChange}
              >
                <SelectTrigger
                  id="contracts-employee-filter"
                  className="h-9 rounded-lg border-border/60"
                >
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
                      key: 'documents',
                      header: 'Documentos',
                      render: (contract) => (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void openDocuments(contract)}
                        >
                          <FileText />
                          {contract.documentCount} archivo(s)
                        </Button>
                      ),
                    },
                    {
                      key: 'actions',
                      header: 'Acciones',
                      render: (contract) => (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(contract)}
                          >
                            <PencilLine />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmRenew(contract)}
                          >
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

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={drawerTitle}
        description={drawerDescription}
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDrawerOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="contract-form"
              disabled={saving || !form.employeeId || !form.startDate}
            >
              {saving ? <Loader2 className="animate-spin" /> : null}
              {saving ? 'Guardando...' : submitLabel}
            </Button>
          </>
        }
      >
        <form id="contract-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-employee">Empleado</Label>
            {formMode !== 'create' ? (
              <Input
                id="contract-employee"
                value={selectedFormEmployee?.fullName ?? 'Empleado no disponible'}
                disabled
                className="rounded-lg border-border/60"
              />
            ) : (
              <Popover modal open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-9 w-full justify-between rounded-lg border-border/60 px-3 font-normal',
                      !form.employeeId && 'text-muted-foreground',
                    )}
                  >
                    {selectedFormEmployee?.fullName ?? 'Selecciona un empleado'}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar empleado..."
                      value={employeeSearch}
                      onValueChange={setEmployeeSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No se encontraron empleados.</CommandEmpty>
                      <CommandGroup>
                        {filteredEmployees.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={String(employee.id)}
                            onSelect={(value) => {
                              setForm((current) => ({ ...current, employeeId: value }))
                              setEmployeePopoverOpen(false)
                            }}
                            data-checked={String(form.employeeId === String(employee.id))}
                          >
                            <span className="flex-1 truncate">{employee.fullName}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract-type">Tipo</Label>
            <Select
              value={form.contractType}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, contractType: value }))
              }
            >
              <SelectTrigger
                id="contract-type"
                className="rounded-lg border-border/60"
              >
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
                className="rounded-lg border-border/60"
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
                className="rounded-lg border-border/60"
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
              <SelectTrigger
                id="contract-status"
                className="rounded-lg border-border/60"
              >
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
        open={documentTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDocumentTarget(null)
            setDocuments([])
          }
        }}
        title="Documentos del contrato"
        description={
          documentTarget
            ? `${documentTarget.employeeName} · ${CONTRACT_TYPE_LABELS[documentTarget.contractType] ?? documentTarget.contractType}`
            : ''
        }
        size="md"
        footer={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDocumentTarget(null)
              setDocuments([])
            }}
          >
            Cerrar
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4">
            <Label
              htmlFor="contract-document-upload"
              className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {uploadingDocument ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Upload className="size-5" />
                )}
              </div>
              <span className="text-sm font-medium">
                {uploadingDocument ? 'Cargando documento...' : 'Cargar documento'}
              </span>
              <span className="max-w-sm text-xs text-muted-foreground">
                Adjunta contratos firmados, anexos o soportes en PDF, Word o imagen. Tamaño máximo: 10 MB.
              </span>
            </Label>
            <Input
              id="contract-document-upload"
              type="file"
              disabled={uploadingDocument}
              onChange={handleDocumentUpload}
              className="sr-only"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            />
          </div>

          {loadingDocuments ? (
            <TableSkeleton rows={3} columns={3} />
          ) : documents.length ? (
            <div className="space-y-2">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{document.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(document.fileSize)} · {formatDate(document.uploadedAt)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDocumentDownload(document)}
                  >
                    <Download />
                    Descargar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin documentos cargados"
              description="Los archivos asociados a este contrato aparecerán aquí."
              icon={FileText}
            />
          )}
        </div>
      </EntityDrawer>

      <ConfirmDialog
        open={confirmRenew !== null}
        onOpenChange={() => setConfirmRenew(null)}
        title="Renovar contrato"
        description={
          confirmRenew
            ? `¿Deseas renovar el contrato de ${confirmRenew.employeeName}? Se creará un nuevo registro conservando el historial.`
            : ''
        }
        confirmLabel="Continuar"
        onConfirm={() => {
          if (confirmRenew) {
            const target = confirmRenew
            setConfirmRenew(null)
            startRenew(target)
          }
        }}
      />
    </div>
  )
}
