import { Skeleton } from './Skeleton'

export const OrdersListSkeleton = () => (
  <div className="container mx-auto p-4 pb-44 md:p-6 md:pb-28">
    <div className="mb-4 grid grid-cols-3 gap-2 rounded-3xl border border-white/70 bg-white/70 p-1.5 shadow-sm backdrop-blur">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-10 rounded-2xl" />
      ))}
    </div>

    <div className="grid gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-4 w-28" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
      ))}
    </div>

    <div className="fixed inset-x-3 bottom-24 z-40 md:sticky md:bottom-4 md:inset-x-auto md:mx-auto md:mt-6 md:max-w-md">
      <div className="rounded-3xl border border-white/70 bg-background/85 p-2 shadow-lg backdrop-blur-xl">
        <Skeleton className="h-11 w-full rounded-2xl" />
      </div>
    </div>
  </div>
)
