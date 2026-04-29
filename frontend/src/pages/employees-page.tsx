import { useCallback, useEffect, useState } from 'react'
import { Eye, Loader2, PencilLine, Plus, RefreshCcw, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { CardSkeleton } from '@/components/app/card-skeleton'
import { DataTable } from '@/components/app/data-table'
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
import { useAuth } from '@/contexts/auth-context'
import { formatDate } from '@/lib/format'
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
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState(initialErrors)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  const startEdit = (employee: EmployeeRecord) => {
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
  }

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

      toast.success(editingId ? 'Empleado actualizado correctamente.' : 'Empleado registrado correctamente.')
      resetForm()
      await loadEmployees()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo guardar el empleado.'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (
    employee: EmployeeRecord,
    nextStatus: 'ACTIVE' | 'INACTIVE',
  ) => {
    try {
      await apiRequest(`/employees/${employee.id}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: nextStatus }),
      })
      toast.success(nextStatus === 'ACTIVE' ? 'Empleado activado correctamente.' : 'Empleado desactivado correctamente.')
      await loadEmployees()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo actualizar el estado del empleado.'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Empleados"
        description="Gestiona la ficha principal del personal y su cuenta de acceso asociada al sistema."
        actions={
          <Button type="button" onClick={resetForm}>
            <Plus />
            Nuevo
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_460px]">
        <Card className="rounded-3xl">
          <CardHeader className="gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employees-search">Buscar</Label>
                <Input
                  id="employees-search"
                  placeholder="Nombre, correo o DNI"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employees-status">Estado</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="employees-status">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="ACTIVE">Activos</SelectItem>
                    <SelectItem value="INACTIVE">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'employee',
                    header: 'Empleado',
                    render: (employee) => (
                      <div>
                        <p className="font-medium">{employee.fullName}</p>
                        <p className="text-muted-foreground">{employee.email}</p>
                        <p className="text-xs text-muted-foreground">
                          DNI: {employee.dni} · Ingreso: {formatDate(employee.hireDate)}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: 'organization',
                    header: 'Organización',
                    render: (employee) => (
                      <div>
                        <p>{employee.positionName}</p>
                        <p className="text-muted-foreground">{employee.areaName}</p>
                        <p className="text-xs text-muted-foreground">{employee.siteName}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: (employee) => (
                      <div className="space-y-2">
                        <StatusBadge value={employee.status} />
                        <p className="text-xs text-muted-foreground">{employee.roleLabel}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Acciones',
                    render: (employee) => (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/app/employees/${employee.id}`)}
                        >
                          <Eye />
                          Ver
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(employee)}>
                          <PencilLine />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleStatusChange(
                              employee,
                              employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                            )
                          }
                        >
                          {employee.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    ),
                  },
                ]}
                rows={employees}
                getRowKey={(employee) => employee.id}
                emptyTitle="No hay empleados registrados"
                emptyDescription="No existen empleados que coincidan con los filtros actuales."
                emptyIcon={Users}
                emptyAction={
                  <Button type="button" onClick={resetForm}>
                    <Plus />
                    Registrar empleado
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {loading ? (
          <CardSkeleton header lines={6} />
        ) : (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{editingId ? 'Editar empleado' : 'Nuevo empleado'}</CardTitle>
            <CardDescription>Registra la ficha principal del colaborador y su usuario asociado.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="employee-name">Nombre completo</Label>
                  <Input
                    id="employee-name"
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    placeholder="Nombre completo"
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
                    <SelectTrigger id="employee-role">
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
                  />
                  {errors.hireDate ? <p className="text-xs text-destructive">{errors.hireDate}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-position">Cargo</Label>
                  <Select
                    value={form.positionId}
                    onValueChange={(value) => setForm((current) => ({ ...current, positionId: value }))}
                  >
                    <SelectTrigger id="employee-position">
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
                    <SelectTrigger id="employee-site">
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
              <div className="flex flex-wrap gap-3">
                <Button disabled={saving} type="submit">
                  {saving ? <Loader2 className="animate-spin" /> : null}
                  {editingId ? 'Guardar cambios' : 'Registrar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <RefreshCcw />
                  Limpiar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  )
}
