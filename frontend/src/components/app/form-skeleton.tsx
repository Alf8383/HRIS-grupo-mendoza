import { Skeleton } from '@/components/ui/skeleton'

type FormSkeletonProps = {
  fields?: number
}

export function FormSkeleton({ fields = 6 }: FormSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div
            key={i}
            className={`space-y-2 ${i < 2 ? 'sm:col-span-2' : ''}`}
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}
