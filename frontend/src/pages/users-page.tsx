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
  UserCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/app/confirm-dialog'
import { DataTable } from '@/components/app/data-table'
import { EmptyState } from '@/components/app/empty-state'
import { EntityDrawer, EntityDrawerActions } from '@/components/app/entity-drawer'
import { PageHeader } from '@/components/app/page-header'
import { TableSkeleton } from '@/components/app/table-skeleton'
import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState(initialErrors)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmStatus, setConfirmStatus] = useState<{
    user: UserRecord
    nextStatus: 'ACTIVE' | 'INACTIVE'
  } | null>(null)

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

  const openCreate = () => {
    resetForm()
    setDrawerOpen(true)
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
    setDrawerOpen(true)
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
      setDrawerOpen(false)
      resetForm()
      await loadUsers()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo guardar el usuario.'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (user: UserRecord, nextStatus: 'ACTIVE' | 'INACTIVE') => {
    setConfirmStatus({ user, nextStatus })
  }

  const confirmStatusChange = async () => {
    if (!confirmStatus) return
    try {
      await apiRequest(`/users/${confirmStatus.user.id}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: confirmStatus.nextStatus }),
      })
      toast.success(
        confirmStatus.nextStatus === 'ACTIVE'
          ? 'Usuario activado correctamente.'
          : 'Usuario desactivado correctamente.',
      )
      await loadUsers()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo actualizar el estado del usuario.'))
    } finally {
      setConfirmStatus(null)
    }
  }

  const columns = useMemo<ColumnDef<UserRecord>[]>(
    () => [
      {
        accessorKey: 'user',
        header: 'Usuario',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span>{row.original.roleLabel}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.linkedEmployee ? 'Vinculado a empleado' : 'Cuenta independiente'}
            </span>
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
        header: '',
        cell: ({ row }) => {
          const user = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/app/users/${user.id}`)}>
                  <Eye className="mr-2 size-3.5" /> Ver detalle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => startEdit(user)}>
                  <PencilLine className="mr-2 size-3.5" /> Editar
                </DropdownMenuItem>
                {user.status === 'ACTIVE' ? (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(user, 'INACTIVE')}
                    className="text-destructive focus:text-destructive"
                  >
                    <PowerOff className="mr-2 size-3.5" /> Desactivar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleStatusChange(user, 'ACTIVE')}>
                    <Power className="mr-2 size-3.5" /> Activar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [navigate],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description="Administra las cuentas internas del sistema, su rol operativo y su disponibilidad de acceso."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 size-4" />
            Nuevo usuario
          </Button>
        }
      />

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="users-search">Buscar</Label>
              <Input
                id="users-search"
                placeholder="Nombre o correo"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-lg border-border/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="users-status">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="users-status" className="rounded-lg border-border/60">
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
                <SelectTrigger id="users-role" className="rounded-lg border-border/60">
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
              columns={columns}
              data={users}
              searchPlaceholder="Buscar usuario..."
              pageSize={10}
              emptyState={
                <EmptyState
                  icon={UserCircle}
                  title="No hay usuarios registrados"
                  description="No existen usuarios que coincidan con los filtros actuales."
                  actionLabel="Crear usuario"
                  onAction={openCreate}
                />
              }
            />
          )}
        </CardContent>
      </Card>

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingId ? 'Editar usuario' : 'Nuevo usuario'}
        description="Define la cuenta de acceso y el rol operativo del usuario."
        size="md"
        footer={<EntityDrawerActions onCancel={() => setDrawerOpen(false)} isLoading={saving} />}
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Nombre completo</Label>
            <Input
              id="user-name"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Ingresa el nombre completo"
              className="rounded-lg border-border/60"
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
              className="rounded-lg border-border/60"
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
                className="rounded-lg border-border/60"
              />
              {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="user-role">Rol</Label>
            <Select value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value }))}>
              <SelectTrigger id="user-role" className="rounded-lg border-border/60">
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
        title={
          confirmStatus
            ? confirmStatus.nextStatus === 'ACTIVE'
              ? 'Activar usuario'
              : 'Desactivar usuario'
            : ''
        }
        description={
          confirmStatus
            ? confirmStatus.nextStatus === 'ACTIVE'
              ? `¿Deseas activar a ${confirmStatus.user.fullName}?`
              : `¿Deseas desactivar a ${confirmStatus.user.fullName}?`
            : ''
        }
        variant={confirmStatus?.nextStatus === 'INACTIVE' ? 'destructive' : 'default'}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
