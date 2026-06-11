import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '@/shared/api/supabase'
import { AuthContext, type UserProfile } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null)
      return
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (error) {
      console.error('Profile loading error:', error)
      setProfile(null)
      return
    }

    setProfile(data as UserProfile | null)
  }, [])

  const applySession = useCallback(
    async (currentSession: Session | null) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      await loadProfile(currentSession?.user ?? null)
    },
    [loadProfile]
  )

  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      setIsLoading(true)

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      await applySession(currentSession)

      if (isMounted) {
        setIsLoading(false)
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      void applySession(currentSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [applySession])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      signOut,
    }),
    [isLoading, profile, session, signOut, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
