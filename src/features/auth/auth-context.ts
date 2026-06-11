import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type UserProfile = {
  id: string
  full_name?: string | null
  role?: string | null
  grade?: string | null
  [key: string]: unknown
}

export type AuthContextValue = {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
)
