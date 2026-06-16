import type { ColumnDef } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BriefcaseBusiness, Loader2, MoreHorizontal, PencilLine, Plus, Power, PowerOff } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { apiRequest, getApiMessage } from '@/lib/http'
import { useDebounce } from '@/lib/use-debounce'
import type { Area, Position } from '@/types/domain'

const initialForm = {
  name: '',
  description: '',
  areaId: '',
}

export function PositionsPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''

  const [positions, setPositions] = useState<Position[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [areaFilter, setAreaFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmStatus, setConfirmStatus] = useState<{
    position: Position
    nextStatus: 'ACTIVE' | 'INACTIVE'
  } | null>(null)

  const debouncedSearch = useDebounce(search, 400)

  const loadAreas = useCallback(async () => {
    if (!token) return
    try {
      const response = await apiRequest<Area[]>('/areas?status=ACTIVE', { token })
      setAreas(response)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudieron cargar las áreas.'))
    }
  }, [token])

  const loadPositions = useCallback(async () => {
    if (!token) return
    setLoading(true)

    try {
      const params = new URLSearchParams()
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
      if (status !== 'ALL') params.set('status', status)
      if (areaFilter !== 'ALL') params.set('areaId', areaFilter)

      const response = await apiRequest<Position[]>(
        `/positions${params.size ? `?${params.toString()}` : ''}`,
        { token },
      )

      setPositions(response)
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudieron cargar los cargos.'))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, status, areaFilter, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAreas()
  }, [token, loadAreas])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPositions()
  }, [token, loadPositions])

  const resetForm = () => {
    setEditingId(null)
    setForm(initialForm)
  }

  const openCreate = () => {
    resetForm()
    setDrawerOpen(true)
  }

  const startEdit = (position: Position) => {
    setEditingId(position.id)
    setForm({
      name: position.name,
      description: position.description ?? '',
      areaId: String(position.area.id),
    })
    setDrawerOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    try {
      await apiRequest(editingId ? `/positions/${editingId}` : '/positions', {
        method: editingId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          areaId: Number(form.areaId),
        }),
      })

      toast.success(editingId ? 'Cargo actualizado correctamente.' : 'Cargo registrado correctamente.')
      setDrawerOpen(false)
      resetForm()
      await loadPositions()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo guardar el cargo.'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (position: Position, nextStatus: 'ACTIVE' | 'INACTIVE') => {
    setConfirmStatus({ position, nextStatus })
  }

  const confirmStatusChange = async () => {
    if (!confirmStatus) return
    try {
      await apiRequest(`/positions/${confirmStatus.position.id}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: confirmStatus.nextStatus }),
      })
      toast.success(
        confirmStatus.nextStatus === 'ACTIVE'
          ? 'Cargo activado correctamente.'
          : 'Cargo desactivado correctamente.',
      )
      await loadPositions()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo actualizar el cargo.'))
    } finally {
      setConfirmStatus(null)
    }
  }

  const columns = useMemo<ColumnDef<Position>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Cargo',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.description || 'Sin descripción registrada'}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'area',
        header: 'Área',
        cell: ({ row }) => row.original.area.name,
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
          const position = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => startEdit(position)}>
                  <PencilLine className="mr-2 size-3.5" /> Editar
                </DropdownMenuItem>
                {position.status === 'ACTIVE' ? (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(position, 'INACTIVE')}
                    className="text-destructive focus:text-destructive"
                  >
                    <PowerOff className="mr-2 size-3.5" /> Desactivar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleStatusChange(position, 'ACTIVE')}>
                    <Power className="mr-2 size-3.5" /> Activar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cargos"
        description="Gestiona los cargos disponibles y su relación con las áreas organizacionales."
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1.5 size-4" />
            Nuevo
          </Button>
        }
      />

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="positions-search">Buscar</Label>
              <Input
                id="positions-search"
                placeholder="Buscar cargo..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-lg border-border/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="positions-status">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="positions-status" className="rounded-lg border-border/60">
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
              <Label htmlFor="positions-area">Área</Label>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger id="positions-area" className="rounded-lg border-border/60">
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : (
            <DataTable
              columns={columns}
              data={positions}
              searchPlaceholder="Buscar cargo..."
              pageSize={10}
              emptyState={
                <EmptyState
                  icon={BriefcaseBusiness}
                  title="No hay cargos registrados"
                  description="Aún no existen cargos que coincidan con los filtros actuales."
                  actionLabel="Crear cargo"
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
        title={editingId ? 'Editar cargo' : 'Nuevo cargo'}
        description="Define el área asociada al cargo y su información principal."
        size="md"
        footer={
          <EntityDrawerActions
            onCancel={() => setDrawerOpen(false)}
            isLoading={saving}
            form="position-form"
          />
        }
      >
        <form id="position-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="position-name">Nombre</Label>
            <Input
              id="position-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ej. Analista de RR. HH."
              className="rounded-lg border-border/60"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position-area">Área</Label>
            <Select value={form.areaId} onValueChange={(value) => setForm((current) => ({ ...current, areaId: value }))}>
              <SelectTrigger id="position-area" className="rounded-lg border-border/60">
                <SelectValue placeholder="Selecciona un área" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={String(area.id)}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position-description">Descripción</Label>
            <Textarea
              id="position-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Responsabilidades o notas del cargo"
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

      <ConfirmDialog
        open={confirmStatus !== null}
        onOpenChange={() => setConfirmStatus(null)}
        title={
          confirmStatus
            ? confirmStatus.nextStatus === 'ACTIVE'
              ? 'Activar cargo'
              : 'Desactivar cargo'
            : ''
        }
        description={
          confirmStatus
            ? confirmStatus.nextStatus === 'ACTIVE'
              ? `¿Deseas activar ${confirmStatus.position.name}?`
              : `¿Deseas desactivar ${confirmStatus.position.name}?`
            : ''
        }
        variant={confirmStatus?.nextStatus === 'INACTIVE' ? 'destructive' : 'default'}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
