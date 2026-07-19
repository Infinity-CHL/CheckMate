import { Skeleton } from './Skeleton'

export const MenuSkeleton = () => (
  <div className="container mx-auto max-w-4xl p-3 pb-24 md:p-6">
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/70 bg-white/70 p-1.5 shadow-sm backdrop-blur">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-9 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-11 rounded-2xl" />
    </div>

    <div className="mt-4 space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-4 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
)
