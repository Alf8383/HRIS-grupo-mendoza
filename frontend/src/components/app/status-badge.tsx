import { Badge } from '@/components/ui/badge'

type StatusBadgeProps = {
  value: string
}

const LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  PRESENT: 'Presente',
  LATE: 'Tardanza',
  ABSENT: 'Inasistencia',
  JUSTIFIED_LATE: 'Tardanza justificada',
  JUSTIFIED_ABSENT: 'Inasistencia justificada',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Vencido',
  TERMINATED: 'Terminado',
}

const STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  PRESENT: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  INACTIVE: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  LATE: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  ABSENT: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900',
  REJECTED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900',
  JUSTIFIED_LATE: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900',
  JUSTIFIED_ABSENT: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900',
  TERMINATED: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const normalized = value.toUpperCase()
  const label = LABELS[normalized] ?? value
  const style = STYLES[normalized] ?? 'bg-muted text-muted-foreground border-border'

  return (
    <Badge variant="outline" className={style}>
      {label}
    </Badge>
  )
}
