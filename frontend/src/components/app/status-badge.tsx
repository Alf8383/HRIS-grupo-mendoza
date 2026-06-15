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
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200/70 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/60',
  PRESENT: 'bg-emerald-100 text-emerald-800 border-emerald-200/70 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/60',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200/70 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/60',
  INACTIVE: 'bg-stone-100 text-stone-700 border-stone-200/70 dark:bg-stone-800/60 dark:text-stone-300 dark:border-stone-700/60',
  CANCELLED: 'bg-stone-100 text-stone-700 border-stone-200/70 dark:bg-stone-800/60 dark:text-stone-300 dark:border-stone-700/60',
  LATE: 'bg-amber-100 text-amber-800 border-amber-200/70 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/60',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200/70 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/60',
  ABSENT: 'bg-red-100 text-red-800 border-red-200/70 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/60',
  REJECTED: 'bg-red-100 text-red-800 border-red-200/70 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/60',
  JUSTIFIED_LATE: 'bg-orange-100 text-orange-800 border-orange-200/70 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800/60',
  JUSTIFIED_ABSENT: 'bg-orange-100 text-orange-800 border-orange-200/70 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800/60',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200/70 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/60',
  TERMINATED: 'bg-stone-100 text-stone-700 border-stone-200/70 dark:bg-stone-800/60 dark:text-stone-300 dark:border-stone-700/60',
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
