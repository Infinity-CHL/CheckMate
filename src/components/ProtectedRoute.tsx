import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { Skeleton } from '@/shared/ui/skeletons'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 p-3 md:p-6">
        <div className="mx-auto grid max-w-3xl gap-4">
          <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="mt-2 h-3 w-28" />
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur"
              >
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return session ? <>{children}</> : <Navigate to="/login" replace />
}
