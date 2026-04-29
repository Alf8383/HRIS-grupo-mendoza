import { useCallback, useEffect, useState } from 'react'
import { Eye, Loader2, PencilLine, Plus, RefreshCcw, UserCircle } from 'lucide-react'
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
import { apiRequest, getApiMessage } from '@/lib/http'
import { ROLE_LABELS } from '@/lib/roles'
import { useDebounce } from '@/lib/use-debounce'
import { validateEmail, validateRequired } from '@/lib/validation'
import type { UserRecord } from '@/types/domain'

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
}

const initialErrors: Record<string, string> = {}

export function UsersPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const token = session?.token ?? ''

  const [users, setUsers] = useState<UserRecord[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState(initialErrors)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  const loadUsers = useCallback(async () => {
    if (!token) return
    setLoading(true)

    try {
      const params = new URLSearchParams()
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
      if (status !== 'ALL') params.set('status', status)
      if (roleFilter !== 'ALL') params.set('role', roleFilter)

      const response = await apiRequest<UserRecord[]>(
        `/users${params.size ? `?${params.toString()}` : ''}`,
        { token },
      )

      setUsers(response)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudieron cargar los usuarios.'))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, status, roleFilter, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsers()
  }, [token, loadUsers])

  const resetForm = () => {
    setEditingId(null)
    setForm(initialForm)
    setErrors(initialErrors)
  }

  const startEdit = (user: UserRecord) => {
    setEditingId(user.id)
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
    })
    setErrors(initialErrors)
  }

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {}

    const nameError = validateRequired(form.fullName)
    if (nameError) nextErrors.fullName = nameError.message

    const emailError = validateEmail(form.email)
    if (emailError) nextErrors.email = emailError.message

    if (!editingId) {
      const passwordError = validateRequired(form.password)
      if (passwordError) nextErrors.password = passwordError.message
    }

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
          }
        : {
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            role: form.role,
          }

      await apiRequest(editingId ? `/users/${editingId}` : '/users', {
        method: editingId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify(payload),
      })

      toast.success(editingId ? 'Usuario actualizado correctamente.' : 'Usuario registrado correctamente.')
      resetForm()
      await loadUsers()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo guardar el usuario.'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (user: UserRecord, nextStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      await apiRequest(`/users/${user.id}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: nextStatus }),
      })
      toast.success(nextStatus === 'ACTIVE' ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.')
      await loadUsers()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo actualizar el estado del usuario.'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description="Administra las cuentas internas del sistema, su rol operativo y su disponibilidad de acceso."
        actions={
          <Button type="button" onClick={resetForm}>
            <Plus />
            Nuevo
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_420px]">
        <Card className="rounded-3xl">
          <CardHeader className="gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="users-search">Buscar</Label>
                <Input
                  id="users-search"
                  placeholder="Nombre o correo"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="users-status">Estado</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="users-status">
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
                <Label htmlFor="users-role">Rol</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger id="users-role">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    {Object.entries(ROLE_LABELS).map(([code, label]) => (
                      <SelectItem key={code} value={code}>
                        {label}
                      </SelectItem>
                    ))}
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
                    key: 'user',
                    header: 'Usuario',
                    render: (user) => (
                      <div>
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-muted-foreground">{user.email}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'role',
                    header: 'Rol',
                    render: (user) => (
                      <div className="flex flex-col gap-1">
                        <span>{user.roleLabel}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.linkedEmployee ? 'Vinculado a empleado' : 'Cuenta independiente'}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: (user) => <StatusBadge value={user.status} />,
                  },
                  {
                    key: 'actions',
                    header: 'Acciones',
                    render: (user) => (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/app/users/${user.id}`)}
                        >
                          <Eye />
                          Ver
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(user)}>
                          <PencilLine />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleStatusChange(
                              user,
                              user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                            )
                          }
                        >
                          {user.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    ),
                  },
                ]}
                rows={users}
                getRowKey={(user) => user.id}
                emptyTitle="No hay usuarios registrados"
                emptyDescription="No existen usuarios que coincidan con los filtros actuales."
                emptyIcon={UserCircle}
                emptyAction={
                  <Button type="button" onClick={resetForm}>
                    <Plus />
                    Crear usuario
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {loading ? (
          <CardSkeleton header lines={4} />
        ) : (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{editingId ? 'Editar usuario' : 'Nuevo usuario'}</CardTitle>
            <CardDescription>Define la cuenta de acceso y el rol operativo del usuario.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="user-name">Nombre completo</Label>
                <Input
                  id="user-name"
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  placeholder="Ingresa el nombre completo"
                />
                {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Correo</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="correo@empresa.com"
                />
                {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
              </div>
              {!editingId ? (
                <div className="space-y-2">
                  <Label htmlFor="user-password">Contraseña temporal</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                  />
                  {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="user-role">Rol</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm((current) => ({ ...current, role: value }))}
                >
                  <SelectTrigger id="user-role">
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
