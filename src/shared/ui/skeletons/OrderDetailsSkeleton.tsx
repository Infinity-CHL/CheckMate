import { Skeleton } from './Skeleton'

export const OrderDetailsSkeleton = () => (
  <div className="container mx-auto max-w-4xl p-3 pb-44 md:p-6 md:pb-8">
    <div className="mb-4 rounded-3xl border border-white/70 bg-white/85 p-3 shadow-sm backdrop-blur">
      <Skeleton className="h-5 w-36" />
    </div>

    <div className="grid gap-3">
      <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-2xl" />
          <Skeleton className="h-11 flex-1 rounded-2xl" />
          <Skeleton className="h-11 w-12 rounded-2xl" />
        </div>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4 divide-y divide-border/70">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="py-3 first:pt-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-7 w-10 rounded-xl" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="ml-10 mt-2 h-5 w-36 rounded-full" />
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 border-t border-border/70 pt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    </div>

    <div className="fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-40 md:hidden">
      <div className="rounded-3xl border border-white/70 bg-background/85 p-2 shadow-lg backdrop-blur-xl">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  </div>
)
