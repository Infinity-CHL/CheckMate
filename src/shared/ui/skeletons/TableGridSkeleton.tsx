import { Skeleton } from './Skeleton'

export const TableGridSkeleton = () => (
  <div className="container mx-auto max-w-5xl p-3 pb-24 md:p-6">
    <div className="mb-4 grid grid-cols-3 gap-2 rounded-3xl border border-white/70 bg-white/70 p-1.5 shadow-sm backdrop-blur">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-10 rounded-2xl" />
      ))}
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 20 }).map((_, index) => (
        <div
          key={index}
          className="min-h-28 rounded-3xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur"
        >
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-12 w-16 rounded-2xl" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-4 w-20" />
          <Skeleton className="mt-2 h-3 w-14" />
        </div>
      ))}
    </div>
  </div>
)
