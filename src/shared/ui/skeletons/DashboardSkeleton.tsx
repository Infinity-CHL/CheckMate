import { Skeleton } from './Skeleton'

export const DashboardSkeleton = () => (
  <div className="container mx-auto max-w-3xl p-3 pb-28 md:p-6 md:pb-6">
    <div className="mb-3 rounded-3xl border border-white/70 bg-white/85 p-3 shadow-sm backdrop-blur">
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-muted/60 p-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 rounded-xl" />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-2xl" />
      </div>
    </div>

    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[150px] rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur"
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="mt-6 h-4 w-24" />
          <Skeleton className="mt-2 h-7 w-28" />
          <Skeleton className="mt-5 h-3 w-20" />
        </div>
      ))}
      <div className="col-span-2 rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-9 w-44" />
        <Skeleton className="mt-3 h-4 w-40" />
      </div>
    </div>
  </div>
)
