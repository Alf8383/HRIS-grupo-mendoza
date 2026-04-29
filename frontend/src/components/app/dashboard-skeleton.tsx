import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="rounded-3xl border-none bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90 p-6 shadow-xl">
          <Skeleton className="mb-4 h-6 w-32 bg-white/20" />
          <Skeleton className="mb-3 h-10 w-3/4 bg-white/20" />
          <Skeleton className="mb-6 h-16 w-full bg-white/10" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Skeleton className="mb-4 size-5 bg-white/20" />
                <Skeleton className="mb-2 h-4 w-24 bg-white/20" />
                <Skeleton className="h-3 w-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border p-6">
          <Skeleton className="mb-2 h-6 w-32" />
          <Skeleton className="mb-6 h-4 w-48" />
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border p-6">
          <Skeleton className="mb-2 h-6 w-32" />
          <Skeleton className="mb-6 h-4 w-48" />
          <Skeleton className="mb-4 h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="rounded-3xl border p-6">
          <Skeleton className="mb-2 h-6 w-32" />
          <Skeleton className="mb-6 h-4 w-48" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
