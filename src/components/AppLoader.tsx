import { UtensilsCrossed } from 'lucide-react'

type AppLoaderProps = {
  text?: string
  fullScreen?: boolean
}

export const AppLoader = ({
  text = 'Готовим данные...',
  fullScreen = false,
}: AppLoaderProps) => (
  <div
    className={
      fullScreen
        ? 'flex min-h-screen items-center justify-center px-4'
        : 'flex min-h-[320px] items-center justify-center px-4'
    }
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
