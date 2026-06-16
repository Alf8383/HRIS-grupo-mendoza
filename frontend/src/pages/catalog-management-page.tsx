import type { ColumnDef } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Inbox, Loader2, MoreHorizontal, PencilLine, Plus, Power, PowerOff } from 'lucide-react'
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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmStatus, setConfirmStatus] = useState<{
    item: CatalogRecord
    nextStatus: 'ACTIVE' | 'INACTIVE'
  } | null>(null)

  const debouncedSearch = useDebounce(search, 400)

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

  const resetForm = () => {
    setEditingId(null)
    setForm(initialForm)
  }

  const openCreate = () => {
    resetForm()
    setDrawerOpen(true)
  }

  const startEdit = (item: CatalogRecord) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description ?? '',
    })
    setDrawerOpen(true)
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
      setDrawerOpen(false)
      resetForm()
      await loadItems()
    } catch (error) {
      toast.error(getApiMessage(error, `No se pudo guardar ${itemLabel}.`))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (item: CatalogRecord, nextStatus: 'ACTIVE' | 'INACTIVE') => {
    setConfirmStatus({ item, nextStatus })
  }

  const confirmStatusChange = async () => {
    if (!confirmStatus) return
    try {
      await apiRequest(`${endpoint}/${confirmStatus.item.id}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status: confirmStatus.nextStatus }),
      })

      toast.success(
        confirmStatus.nextStatus === 'ACTIVE'
          ? `${itemLabel} activado correctamente.`
          : `${itemLabel} desactivado correctamente.`,
      )
      await loadItems()
    } catch (error) {
      toast.error(getApiMessage(error, `No se pudo actualizar ${itemLabel}.`))
    } finally {
      setConfirmStatus(null)
    }
  }

  const columns = useMemo<ColumnDef<CatalogRecord>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
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
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <StatusBadge value={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const item = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => startEdit(item)}>
                  <PencilLine className="mr-2 size-3.5" /> Editar
                </DropdownMenuItem>
                {item.status === 'ACTIVE' ? (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(item, 'INACTIVE')}
                    className="text-destructive focus:text-destructive"
                  >
                    <PowerOff className="mr-2 size-3.5" /> Desactivar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleStatusChange(item, 'ACTIVE')}>
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
        title={title}
        description={description}
        actions={
          <Button onClick={openCreate} type="button">
            <Plus className="mr-1.5 size-4" />
            Nuevo
          </Button>
        }
      />

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`${endpoint}-search`}>Buscar</Label>
              <Input
                id={`${endpoint}-search`}
                placeholder={`Buscar ${itemLabel.toLowerCase()}...`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-lg border-border/60"
              />
            </div>
            <div className="w-full space-y-2 md:max-w-44">
              <Label htmlFor={`${endpoint}-status`}>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id={`${endpoint}-status`} className="rounded-lg border-border/60">
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
            <TableSkeleton rows={5} columns={3} />
          ) : (
            <DataTable
              columns={columns}
              data={items}
              searchPlaceholder="Buscar..."
              pageSize={10}
              emptyState={
                <EmptyState
                  icon={Inbox}
                  title={`No hay ${itemLabel.toLowerCase()} registrados`}
                  description="Aún no existen registros que coincidan con los filtros actuales."
                  actionLabel="Crear registro"
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
        title={editingId ? `Editar ${itemLabel.toLowerCase()}` : `Nuevo ${itemLabel.toLowerCase()}`}
        description="Completa la información principal del registro."
        size="md"
        footer={
          <EntityDrawerActions
            onCancel={() => setDrawerOpen(false)}
            isLoading={saving}
            form="catalog-form"
          />
        }
      >
        <form id="catalog-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${endpoint}-name`}>Nombre</Label>
            <Input
              id={`${endpoint}-name`}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ingresa el nombre"
              className="rounded-lg border-border/60"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${endpoint}-description`}>Descripción</Label>
            <Textarea
              id={`${endpoint}-description`}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Agrega una descripción breve"
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
              ? `Activar ${itemLabel.toLowerCase()}`
              : `Desactivar ${itemLabel.toLowerCase()}`
            : ''
        }
        description={
          confirmStatus
            ? confirmStatus.nextStatus === 'ACTIVE'
              ? `¿Deseas activar ${confirmStatus.item.name}?`
              : `¿Deseas desactivar ${confirmStatus.item.name}?`
            : ''
        }
        variant={confirmStatus?.nextStatus === 'INACTIVE' ? 'destructive' : 'default'}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
