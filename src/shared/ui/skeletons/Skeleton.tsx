import { cn } from '@/lib/utils'

type SkeletonProps = {
  className?: string
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div
    aria-hidden="true"
    className={cn(
      'relative overflow-hidden rounded-2xl bg-slate-200/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-shimmer_1.6s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
      className
    )}
  />
)
