import { Skeleton } from './Skeleton'

export const EmployeesSkeleton = () => (
  <div className="grid gap-5">
    <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <Skeleton className="h-12 w-28 rounded-2xl" />
    </header>

    <div className="hidden rounded-3xl border border-white/70 bg-white/85 p-4 shadow-md backdrop-blur md:block">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-border/70 pb-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-4" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-border/70 py-4 last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-2 h-3 w-44" />
            </div>
          </div>
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      ))}
    </div>

    <div className="grid gap-3 md:hidden">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur"
        >
          <div className="flex gap-3">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-2 h-3 w-44" />
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  </div>
)
