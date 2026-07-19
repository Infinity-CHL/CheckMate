import { Skeleton } from './Skeleton'

export const OrderEditSkeleton = () => (
  <div className="container mx-auto max-w-5xl p-3 pb-44 md:p-6 md:pb-8">
    <div className="mb-4 rounded-3xl border border-white/70 bg-white/85 p-3 shadow-sm backdrop-blur">
      <Skeleton className="h-5 w-48" />
    </div>

    <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="rounded-3xl border border-white/70 bg-white/85 p-3 shadow-sm backdrop-blur">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="mt-3 h-8 rounded-xl" />
        <div className="mt-3 rounded-2xl border border-border/80 bg-background/70">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex min-h-12 items-center justify-between gap-3 border-b border-border/70 px-3 py-2 last:border-b-0"
            >
              <div className="flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-1 h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/85 p-3 shadow-sm backdrop-blur">
        <Skeleton className="h-4 w-28" />
        <div className="mt-3 rounded-2xl border border-dashed border-border/80 bg-background/70">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2 border-b border-dashed border-border/80 p-2 last:border-b-0">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <Skeleton className="h-4" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-14" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-6 w-6 rounded-xl" />
                <Skeleton className="h-6 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="mt-3 h-24 rounded-2xl" />
      </div>
    </div>
  </div>
)
