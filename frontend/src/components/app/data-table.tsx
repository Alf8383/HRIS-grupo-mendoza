import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// Legacy API for existing pages
type LegacyColumn<T> = {
  key: string
  header: string
  render: (row: T) => React.ReactNode
}

interface LegacyDataTableProps<TData> {
  columns: LegacyColumn<TData>[]
  rows: TData[]
  getRowKey: (row: TData) => string | number
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: React.ComponentType<{ className?: string }>
  emptyAction?: React.ReactNode
}

// TanStack API for new/refactored pages
interface TanStackDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  pageSize?: number
  className?: string
  emptyState?: React.ReactNode
}

type DataTableProps<TData, TValue> =
  | (LegacyDataTableProps<TData> & { data?: never })
  | (TanStackDataTableProps<TData, TValue> & { rows?: never })

function isLegacy<TData, TValue>(props: DataTableProps<TData, TValue>): props is LegacyDataTableProps<TData> {
  return 'rows' in props && Array.isArray(props.rows)
}

export function DataTable<TData, TValue = unknown>(props: DataTableProps<TData, TValue>) {
  if (isLegacy(props)) {
    return <LegacyDataTable {...props} />
  }
  return <TanStackDataTable {...props} />
}

function LegacyDataTable<TData>({
  columns,
  rows,
  getRowKey,
  emptyTitle,
  emptyDescription,
  emptyIcon: EmptyIcon,
  emptyAction,
}: LegacyDataTableProps<TData>) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border/60 bg-muted/30 hover:bg-muted/30">
            {columns.map((column) => (
              <TableHead key={column.key} className="h-10 text-xs font-semibold text-muted-foreground">
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <TableRow
                key={getRowKey(row)}
                className={cn(
                  'border-border/60 transition-colors hover:bg-muted/40',
                  index % 2 === 1 && 'bg-muted/20',
                )}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className="py-2.5 text-sm">
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-40 text-center">
                {emptyTitle ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    {EmptyIcon && (
                      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <EmptyIcon className="size-6" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{emptyTitle}</p>
                      {emptyDescription && (
                        <p className="text-xs text-muted-foreground">{emptyDescription}</p>
                      )}
                    </div>
                    {emptyAction && <div className="mt-2">{emptyAction}</div>}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No hay datos disponibles.</span>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function TanStackDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Buscar...',
  pageSize = 10,
  className,
  emptyState,
}: TanStackDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  const showSearch = data.length > 0 || globalFilter.length > 0

  return (
    <div className={cn('space-y-3', className)}>
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 rounded-lg border-border/60 pl-9 text-sm"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border/60 bg-muted/30 hover:bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 text-xs font-semibold text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'border-border/60 transition-colors hover:bg-muted/40',
                    index % 2 === 1 && 'bg-muted/20',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  {emptyState ?? (
                    <span className="text-sm text-muted-foreground">No hay datos disponibles.</span>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data.length > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {table.getRowModel().rows.length} de {data.length} resultados
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
