import { Skeleton } from './Skeleton'

export const ProfileSkeleton = () => (
  <div className="container mx-auto p-4">
    <div className="mx-auto grid max-w-2xl gap-4">
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
        <Skeleton className="h-5 w-32" />
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-28 w-28 rounded-full" />
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <div className="mt-5 grid justify-items-center gap-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="mt-6 grid gap-3">
          <Skeleton className="h-14 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Skeleton className="h-11 rounded-2xl" />
          <Skeleton className="h-11 rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
)
