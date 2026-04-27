import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, PencilLine, Plus, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/app/data-table'
import { EmptyState } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
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
import { useDebounce } from '@/lib/use-debounce'
import type { Area, Site } from '@/types/domain'

type CatalogRecord = Area | Site

type CatalogManagementPageProps = {
  title: string
  description: string
  endpoint: '/areas' | '/sites'
  itemLabel: string
}

const initialForm = {
  name: '',
  description: '',
}

export function CatalogManagementPage({
  title,
  description,
  endpoint,
  itemLabel,
}: CatalogManagementPageProps) {
  const { session } = useAuth()
  const token = session?.token ?? ''

  const [items, setItems] = useState<CatalogRecord[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(initialForm)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  const selectedItem = useMemo(() => {
    const found = items.find((item) => item.id === selectedId)
    if (found) return found
    return items[0] ?? null
  }, [items, selectedId])

  const loadItems = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams()

      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim())
      }

      if (status !== 'ALL') {
        params.set('status', status)
      }

      const response = await apiRequest<CatalogRecord[]>(
        `${endpoint}${params.size ? `?${params.toString()}` : ''}`,
        {
          token,
        },
      )

      setItems(response)
    } catch (error) {
      toast.error(getApiMessage(error, `No se pudo cargar ${itemLabel}.`))
    } finally {
      setLoading(false)
    }
  }, [endpoint, itemLabel, debouncedSearch, status, token])

  useEffect(() => {
    if (!token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadItems()
  }, [token, loadItems])

  const startCreate = () => {
    setEditingId(null)
    setForm(initialForm)
  }

  const startEdit = (item: CatalogRecord) => {
    setEditingId(item.id)
    setSelectedId(item.id)
    setForm({
      name: item.name,
      description: item.description ?? '',
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(initialForm)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        name: form.name,
        description: form.description || null,
      }

      await apiRequest(
        editingId ? `${endpoint}/${editingId}` : endpoint,
        {
          method: editingId ? 'PUT' : 'POST',
          token,
          body: JSON.stringify(payload),
        },
      )

      toast.success(
        editingId
          ? `${itemLabel} actualizado correctamente.`
          : `${itemLabel} registrado correctamente.`,
      )
      resetForm()
      await loadItems()
    } catch (error) {
      toast.error(getApiMessage(error, `No se pudo guardar ${itemLabel}.`))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (item: CatalogRecord, nextStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      await apiRequest(`${endpoint}/${item.id}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: nextStatus }),
      })

      toast.success(
        nextStatus === 'ACTIVE'
          ? `${itemLabel} activado correctamente.`
          : `${itemLabel} desactivado correctamente.`,
      )
      await loadItems()
    } catch (error) {
      toast.error(getApiMessage(error, `No se pudo actualizar ${itemLabel}.`))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={startCreate} type="button">
            <Plus />
            Nuevo
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <Card className="rounded-3xl">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`${endpoint}-search`}>Buscar</Label>
                <Input
                  id={`${endpoint}-search`}
                  placeholder={`Buscar ${itemLabel.toLowerCase()}...`}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="w-full space-y-2 md:max-w-44">
                <Label htmlFor={`${endpoint}-status`}>Estado</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id={`${endpoint}-status`}>
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
              <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Cargando información...
              </div>
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'name',
                    header: 'Nombre',
                    render: (item) => (
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => setSelectedId(item.id)}
                      >
                        <span className="block font-medium text-foreground">
                          {item.name}
                        </span>
                        <span className="block text-muted-foreground">
                          {item.description || 'Sin descripción registrada'}
                        </span>
                      </button>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: (item) => <StatusBadge value={item.status} />,
                  },
                  {
                    key: 'actions',
                    header: 'Acciones',
                    render: (item) => (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(item)}
                        >
                          <PencilLine />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleStatusChange(
                              item,
                              item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                            )
                          }
                        >
                          {item.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    ),
                  },
                ]}
                rows={items}
                getRowKey={(item) => item.id}
                emptyTitle={`No hay ${itemLabel.toLowerCase()} registrados`}
                emptyDescription="Aún no existen registros que coincidan con los filtros actuales."
                emptyAction={
                  <Button type="button" onClick={startCreate}>
                    <Plus />
                    Crear registro
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>
                {editingId ? `Editar ${itemLabel.toLowerCase()}` : `Nuevo ${itemLabel.toLowerCase()}`}
              </CardTitle>
              <CardDescription>
                Completa la información principal del registro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor={`${endpoint}-name`}>Nombre</Label>
                  <Input
                    id={`${endpoint}-name`}
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Ingresa el nombre"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${endpoint}-description`}>Descripción</Label>
                  <textarea
                    id={`${endpoint}-description`}
                    className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Agrega una descripción breve"
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
              <CardDescription>Consulta rápida del registro seleccionado.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="text-sm font-medium">{selectedItem.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Descripción</p>
                    <p className="text-sm font-medium">
                      {selectedItem.description || 'Sin descripción registrada'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <div className="pt-1">
                      <StatusBadge value={selectedItem.status} />
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Sin selección"
                  description="Selecciona un registro del listado para ver su detalle."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
