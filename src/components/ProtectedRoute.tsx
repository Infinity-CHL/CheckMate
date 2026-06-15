import { Navigate } from 'react-router-dom'
import { AppLoader } from '@/components/AppLoader'
import { useAuth } from '@/features/auth/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return <AppLoader fullScreen />
  }

  return session ? <>{children}</> : <Navigate to="/login" replace />
}
