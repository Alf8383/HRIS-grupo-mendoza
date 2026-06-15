import type { ColumnDef } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Eye,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Power,
  PowerOff,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/app/confirm-dialog'
import { DataTable } from '@/components/app/data-table'
import { EntityDrawer, EntityDrawerActions } from '@/components/app/entity-drawer'
import { EmptyState } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { TableSkeleton } from '@/components/app/table-skeleton'
import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { apiRequest, getApiMessage } from '@/lib/http'
import { ROLE_LABELS } from '@/lib/roles'
import { useDebounce } from '@/lib/use-debounce'
import { validateDni, validateEmail, validatePhone, validateRequired } from '@/lib/validation'
import type { EmployeeRecord, Position, Site } from '@/types/domain'

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  dni: '',
  phone: '',
  hireDate: '',
  positionId: '',
  siteId: '',
}

const initialErrors: Record<string, string> = {}

export function EmployeesPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const token = session?.token ?? ''

  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState(initialErrors)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmStatus, setConfirmStatus] = useState<{
    employee: EmployeeRecord
    nextStatus: 'ACTIVE' | 'INACTIVE'
  } | null>(null)

  const debouncedSearch = useDebounce(search, 400)

  const loadCatalogs = useCallback(async () => {
    if (!token) return
    try {
      const [positionsResponse, sitesResponse] = await Promise.all([
        apiRequest<Position[]>('/positions?status=ACTIVE', { token }),
        apiRequest<Site[]>('/sites?status=ACTIVE', { token }),
      ])
      setPositions(positionsResponse)
      setSites(sitesResponse)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudieron cargar los catálogos.'))
    }
  }, [token])

  const loadEmployees = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
      if (status !== 'ALL') params.set('status', status)

      const response = await apiRequest<EmployeeRecord[]>(
        `/employees${params.size ? `?${params.toString()}` : ''}`,
        { token },
      )
      setEmployees(response)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudieron cargar los empleados.'))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, status, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCatalogs()
  }, [token, loadCatalogs])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEmployees()
  }, [token, loadEmployees])

  const resetForm = () => {
    setEditingId(null)
    setForm(initialForm)
    setErrors(initialErrors)
  }

  const openCreate = () => {
    resetForm()
    setDrawerOpen(true)
  }

  const startEdit = useCallback((employee: EmployeeRecord) => {
    const matchedPosition = positions.find((position) => position.name === employee.positionName)
    const matchedSite = sites.find((site) => site.name === employee.siteName)

    setEditingId(employee.id)
    setForm({
      fullName: employee.fullName,
      email: employee.email,
      password: '',
      role: employee.role,
      dni: employee.dni,
      phone: employee.phone ?? '',
      hireDate: employee.hireDate,
      positionId: matchedPosition ? String(matchedPosition.id) : '',
      siteId: matchedSite ? String(matchedSite.id) : '',
    })
    setErrors(initialErrors)
    setDrawerOpen(true)
  }, [positions, sites])

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {}

    const nameError = validateRequired(form.fullName)
    if (nameError) nextErrors.fullName = nameError.message

    const emailError = validateEmail(form.email)
    if (emailError) nextErrors.email = emailError.message

    const dniError = validateDni(form.dni)
    if (dniError) nextErrors.dni = dniError.message

    const phoneError = validatePhone(form.phone)
    if (phoneError) nextErrors.phone = phoneError.message

    if (!editingId) {
      const passwordError = validateRequired(form.password)
      if (passwordError) nextErrors.password = passwordError.message
    }

    if (!form.positionId) nextErrors.positionId = 'Selecciona un cargo.'
    if (!form.siteId) nextErrors.siteId = 'Selecciona una sede.'
    if (!form.hireDate) nextErrors.hireDate = 'Selecciona una fecha de ingreso.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      const payload = editingId
        ? {
            fullName: form.fullName,
            email: form.email,
            role: form.role,
            dni: form.dni,
            phone: form.phone || null,
            hireDate: form.hireDate,
            positionId: Number(form.positionId),
            siteId: Number(form.siteId),
          }
        : {
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            role: form.role,
            dni: form.dni,
            phone: form.phone || null,
            hireDate: form.hireDate,
            positionId: Number(form.positionId),
            siteId: Number(form.siteId),
          }

      await apiRequest(editingId ? `/employees/${editingId}` : '/employees', {
        method: editingId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify(payload),
      })

      toast.success(
        editingId ? 'Empleado actualizado correctamente.' : 'Empleado registrado correctamente.',
      )
      setDrawerOpen(false)
      resetForm()
      await loadEmployees()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo guardar el empleado.'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (employee: EmployeeRecord, nextStatus: 'ACTIVE' | 'INACTIVE') => {
    setConfirmStatus({ employee, nextStatus })
  }

  const confirmStatusChange = async () => {
    if (!confirmStatus) return
    try {
      await apiRequest(`/employees/${confirmStatus.employee.id}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: confirmStatus.nextStatus }),
      })
      toast.success(
        confirmStatus.nextStatus === 'ACTIVE'
          ? 'Empleado activado correctamente.'
          : 'Empleado desactivado correctamente.',
      )
      await loadEmployees()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo actualizar el estado del empleado.'))
    } finally {
      setConfirmStatus(null)
    }
  }

  const columns = useMemo<ColumnDef<EmployeeRecord>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Empleado',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
            <p className="text-xs text-muted-foreground">
              DNI: {row.original.dni}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'positionName',
        header: 'Organización',
        cell: ({ row }) => (
          <div>
            <p className="text-sm">{row.original.positionName}</p>
            <p className="text-xs text-muted-foreground">{row.original.areaName}</p>
            <p className="text-xs text-muted-foreground">{row.original.siteName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => (
          <div className="space-y-1">
            <StatusBadge value={row.original.status} />
            <p className="text-xs text-muted-foreground">{row.original.roleLabel}</p>
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const employee = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/app/employees/${employee.id}`)}>
                  <Eye className="mr-2 size-3.5" /> Ver detalle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => startEdit(employee)}>
                  <PencilLine className="mr-2 size-3.5" /> Editar
                </DropdownMenuItem>
                {employee.status === 'ACTIVE' ? (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(employee, 'INACTIVE')}
                    className="text-destructive focus:text-destructive"
                  >
                    <PowerOff className="mr-2 size-3.5" /> Desactivar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleStatusChange(employee, 'ACTIVE')}>
                    <Power className="mr-2 size-3.5" /> Activar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [navigate, startEdit],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Empleados"
        description="Gestiona la ficha principal del personal y su cuenta de acceso asociada al sistema."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 size-4" />
            Nuevo empleado
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar por nombre, correo o DNI"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 rounded-lg border-border/60"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full rounded-lg border-border/60 sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="ACTIVE">Activos</SelectItem>
            <SelectItem value="INACTIVE">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={4} />
      ) : (
        <DataTable
          columns={columns}
          data={employees}
          searchPlaceholder="Buscar empleado..."
          pageSize={10}
          emptyState={
            <EmptyState
              icon={Users}
              title="No hay empleados registrados"
              description="No existen empleados que coincidan con los filtros actuales."
              actionLabel="Registrar empleado"
              onAction={openCreate}
            />
          }
        />
      )}

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingId ? 'Editar empleado' : 'Nuevo empleado'}
        description="Registra la ficha principal del colaborador y su usuario asociado."
        size="lg"
        footer={<EntityDrawerActions onCancel={() => setDrawerOpen(false)} isLoading={saving} />}
      >
        <form id="employee-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="employee-name">Nombre completo</Label>
              <Input
                id="employee-name"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Nombre completo"
                className="rounded-lg border-border/60"
              />
              {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="employee-email">Correo</Label>
              <Input
                id="employee-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="correo@empresa.com"
                className="rounded-lg border-border/60"
              />
              {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
            </div>
            {!editingId ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="employee-password">Contraseña temporal</Label>
                <Input
                  id="employee-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="rounded-lg border-border/60"
                />
                {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="employee-role">Rol</Label>
              <Select
                value={form.role}
                onValueChange={(value) => setForm((current) => ({ ...current, role: value }))}
              >
                <SelectTrigger id="employee-role" className="rounded-lg border-border/60">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([code, label]) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-dni">DNI</Label>
              <Input
                id="employee-dni"
                value={form.dni}
                onChange={(event) => setForm((current) => ({ ...current, dni: event.target.value }))}
                placeholder="Documento de identidad"
                className="rounded-lg border-border/60"
              />
              {errors.dni ? <p className="text-xs text-destructive">{errors.dni}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-phone">Teléfono</Label>
              <Input
                id="employee-phone"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Teléfono de contacto"
                className="rounded-lg border-border/60"
              />
              {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-hire-date">Fecha de ingreso</Label>
              <Input
                id="employee-hire-date"
                type="date"
                value={form.hireDate}
                onChange={(event) => setForm((current) => ({ ...current, hireDate: event.target.value }))}
                className="rounded-lg border-border/60"
              />
              {errors.hireDate ? <p className="text-xs text-destructive">{errors.hireDate}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-position">Cargo</Label>
              <Select
                value={form.positionId}
                onValueChange={(value) => setForm((current) => ({ ...current, positionId: value }))}
              >
                <SelectTrigger id="employee-position" className="rounded-lg border-border/60">
                  <SelectValue placeholder="Selecciona un cargo" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={String(position.id)}>
                      {position.name} · {position.area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.positionId ? <p className="text-xs text-destructive">{errors.positionId}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-site">Sede</Label>
              <Select
                value={form.siteId}
                onValueChange={(value) => setForm((current) => ({ ...current, siteId: value }))}
              >
                <SelectTrigger id="employee-site" className="rounded-lg border-border/60">
                  <SelectValue placeholder="Selecciona una sede" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={String(site.id)}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.siteId ? <p className="text-xs text-destructive">{errors.siteId}</p> : null}
            </div>
          </div>
          {saving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Guardando...
            </div>
          )}
        </form>
      </EntityDrawer>

      <ConfirmDialog
        open={confirmStatus !== null}
        onOpenChange={() => setConfirmStatus(null)}
        title={confirmStatus?.nextStatus === 'ACTIVE' ? 'Activar empleado' : 'Desactivar empleado'}
        description={
          confirmStatus?.nextStatus === 'ACTIVE'
            ? `¿Deseas activar a ${confirmStatus?.employee.fullName}?`
            : `¿Deseas desactivar a ${confirmStatus?.employee.fullName}?`
        }
        variant={confirmStatus?.nextStatus === 'INACTIVE' ? 'destructive' : 'default'}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
