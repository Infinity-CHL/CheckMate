import { useEffect, useState } from 'react'

import {
  NOTIFICATIONS_CHANGED_EVENT,
  notificationsApi,
  type AppNotification,
} from '@/features/notifications/api/notificationsApi'
import { supabase } from '@/shared/api/supabase'

type UseUnreadNotificationsCountOptions = {
  realtime?: boolean
  onNewNotification?: (notification: AppNotification) => void
}

export const useUnreadNotificationsCount = (
  userId: string | undefined,
  options: UseUnreadNotificationsCountOptions = {}
) => {
  const { realtime = false, onNewNotification } = options
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      setCount(0)
      return
    }

    let isMounted = true

    const loadCount = async () => {
      try {
        setLoading(true)
        const nextCount = await notificationsApi.getUnreadNotificationsCount()

        if (isMounted) {
          setCount(nextCount)
        }
      } catch (err) {
        console.error('useUnreadNotificationsCount load error:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadCount()

    const handleNotificationsChanged = () => {
      loadCount()
    }

    window.addEventListener(
      NOTIFICATIONS_CHANGED_EVENT,
      handleNotificationsChanged
    )

    return () => {
      isMounted = false
      window.removeEventListener(
        NOTIFICATIONS_CHANGED_EVENT,
        handleNotificationsChanged
      )
    }
  }, [userId])

  useEffect(() => {
    if (!userId || !realtime) {
      return
    }

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as AppNotification

          setCount((currentCount) => currentCount + 1)
          onNewNotification?.(notification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onNewNotification, realtime, userId])

  return { count, loading }
}
