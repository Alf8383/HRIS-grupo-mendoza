import { useCallback, useEffect, useMemo, useState } from 'react'
import { BriefcaseBusiness, Loader2, PencilLine, Plus, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { CardSkeleton } from '@/components/app/card-skeleton'
import { DataTable } from '@/components/app/data-table'
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
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(initialForm)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [areaFilter, setAreaFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  const selectedPosition = useMemo(() => {
    const found = positions.find((item) => item.id === selectedId)
    if (found) return found
    return positions[0] ?? null
  }, [positions, selectedId])

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

  const startEdit = (position: Position) => {
    setEditingId(position.id)
    setSelectedId(position.id)
    setForm({
      name: position.name,
      description: position.description ?? '',
      areaId: String(position.area.id),
    })
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
      resetForm()
      await loadPositions()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo guardar el cargo.'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (position: Position, nextStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      await apiRequest(`/positions/${position.id}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: nextStatus }),
      })
      toast.success(nextStatus === 'ACTIVE' ? 'Cargo activado correctamente.' : 'Cargo desactivado correctamente.')
      await loadPositions()
    } catch (error) {
      toast.error(getApiMessage(error, 'No se pudo actualizar el cargo.'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cargos"
        description="Gestiona los cargos disponibles y su relación con las áreas organizacionales."
        actions={
          <Button type="button" onClick={resetForm}>
            <Plus />
            Nuevo
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <Card className="rounded-3xl">
          <CardHeader className="gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="positions-search">Buscar</Label>
                <Input
                  id="positions-search"
                  placeholder="Buscar cargo..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="positions-status">Estado</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="positions-status">
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
                  <SelectTrigger id="positions-area">
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
                columns={[
                  {
                    key: 'name',
                    header: 'Cargo',
                    render: (position) => (
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => setSelectedId(position.id)}
                      >
                        <span className="block font-medium">{position.name}</span>
                        <span className="block text-muted-foreground">
                          {position.description || 'Sin descripción registrada'}
                        </span>
                      </button>
                    ),
                  },
                  {
                    key: 'area',
                    header: 'Área',
                    render: (position) => position.area.name,
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: (position) => <StatusBadge value={position.status} />,
                  },
                  {
                    key: 'actions',
                    header: 'Acciones',
                    render: (position) => (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(position)}>
                          <PencilLine />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleStatusChange(
                              position,
                              position.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                            )
                          }
                        >
                          {position.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    ),
                  },
                ]}
                rows={positions}
                getRowKey={(position) => position.id}
                emptyTitle="No hay cargos registrados"
                emptyDescription="Aún no existen cargos que coincidan con los filtros actuales."
                emptyIcon={BriefcaseBusiness}
                emptyAction={
                  <Button onClick={resetForm} type="button">
                    <Plus />
                    Crear cargo
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {loading ? (
            <>
              <CardSkeleton header lines={3} />
              <CardSkeleton header lines={3} />
            </>
          ) : (
            <>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>{editingId ? 'Editar cargo' : 'Nuevo cargo'}</CardTitle>
              <CardDescription>Define el área asociada al cargo y su información principal.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="position-name">Nombre</Label>
                  <Input
                    id="position-name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ej. Analista de RR. HH."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position-area">Área</Label>
                  <Select
                    value={form.areaId}
                    onValueChange={(value) => setForm((current) => ({ ...current, areaId: value }))}
                  >
                    <SelectTrigger id="position-area">
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
                  />
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

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Detalle</CardTitle>
              <CardDescription>Consulta rápida del cargo seleccionado.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPosition ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cargo</p>
                    <p className="text-sm font-medium">{selectedPosition.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Área</p>
                    <p className="text-sm font-medium">{selectedPosition.area.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Descripción</p>
                    <p className="text-sm font-medium">
                      {selectedPosition.description || 'Sin descripción registrada'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <div className="pt-1">
                      <StatusBadge value={selectedPosition.status} />
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Sin selección"
                  description="Selecciona un cargo del listado para ver su detalle."
                />
              )}
            </CardContent>
          </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
