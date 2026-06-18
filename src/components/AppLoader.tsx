import { UtensilsCrossed } from 'lucide-react'

import { cn } from '@/lib/utils'

type AppLoaderProps = {
  text?: string
  fullScreen?: boolean
  className?: string
}

export const AppLoader = ({
  text = 'Готовим данные...',
  fullScreen = false,
  className,
}: AppLoaderProps) => (
  <div
    className={cn(
      'flex items-center justify-center px-4',
      fullScreen
        ? 'min-h-screen'
        : 'min-h-[calc(100dvh-10.5rem)] md:min-h-[calc(100dvh-4rem)]',
      className
    )}
  >
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/60 bg-white/70 px-6 py-5 text-center shadow-md backdrop-blur">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
        <UtensilsCrossed className="h-5 w-5 animate-pulse" />
        <span className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
      </div>
      <p className="text-xs font-medium text-muted-foreground">{text}</p>
    </div>
  </div>
)
