import { Skeleton } from '@/components/ui/skeleton'

type CardSkeletonProps = {
  header?: boolean
  lines?: number
}

export function CardSkeleton({ header = true, lines = 4 }: CardSkeletonProps) {
  return (
    <div className="rounded-3xl border p-6">
      {header ? (
        <>
          <Skeleton className="mb-2 h-6 w-40" />
          <Skeleton className="mb-6 h-4 w-64" />
        </>
      ) : null}
      <div className="flex flex-col gap-4">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}
