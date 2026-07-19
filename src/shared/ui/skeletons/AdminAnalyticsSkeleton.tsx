import { Skeleton } from './Skeleton'

export const AdminAnalyticsSkeleton = () => (
  <div className="grid gap-5">
    <header>
      <Skeleton className="h-9 w-48 rounded-2xl" />
      <Skeleton className="mt-2 h-4 w-full max-w-xl" />
    </header>

    <section className="grid gap-4 lg:grid-cols-[minmax(0,42rem)_minmax(18rem,1fr)] lg:items-start">
      <div className="w-full max-w-2xl rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur"
          >
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-2 h-3 w-32" />
            <Skeleton className="mt-5 h-16 rounded-2xl" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    </section>

    <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
      <Skeleton className="h-6 w-36" />
      <div className="mt-4 grid gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
)
