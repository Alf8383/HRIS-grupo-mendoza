import type { ReactNode } from 'react'

import { EmptyState } from '@/components/app/empty-state'

type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  emptyTitle: string
  emptyDescription: string
  emptyAction?: ReactNode
  getRowKey: (row: T) => string | number
}

export function DataTable<T>({
  columns,
  rows,
  emptyTitle,
  emptyDescription,
  emptyAction,
  getRowKey,
}: DataTableProps<T>) {
  if (!rows.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 font-medium"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-t transition-colors hover:bg-muted/30"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 align-top ${col.className ?? ''}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
