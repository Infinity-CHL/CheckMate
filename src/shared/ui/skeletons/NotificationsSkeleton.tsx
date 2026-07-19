import { Skeleton } from './Skeleton'

export const NotificationsSkeleton = () => (
  <div className="container mx-auto max-w-3xl p-3 pb-28 md:p-6 md:pb-8">
    <div className="mb-3 rounded-3xl border border-white/70 bg-white/85 p-3 shadow-sm backdrop-blur">
      <Skeleton className="h-5 w-36" />
    </div>
    <div className="grid gap-3">
      <div className="rounded-3xl border border-white/70 bg-white/85 p-2 shadow-sm backdrop-blur">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/60 p-1">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur"
        >
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-4 w-full" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)
