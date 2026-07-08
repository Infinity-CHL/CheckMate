import { supabase } from '@/shared/api/supabase'

export type AppNotification = {
  id: string
  recipient_id: string
  actor_id: string | null
  type: string
  title: string
  body: string | null
  order_id: string | null
  table_number: number | null
  payload: Record<string, unknown> | null
  app_update_id?: string | null
  read_at: string | null
  created_at: string
}

export type AppUpdate = {
  id: string
  title: string
  body: string | null
  version: string | null
  type: string
  is_published: boolean
  published_at: string | null
  created_at: string
}

export const NOTIFICATIONS_CHANGED_EVENT = 'checkmate:notifications-changed'

export const notifyNotificationsChanged = () => {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
}

export const notificationsApi = {
  async getNotifications(): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('notificationsApi.getNotifications error:', error)
      throw error
    }

    return (data || []) as AppNotification[]
  },

  async getUnreadNotificationsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)

    if (error) {
      console.error('notificationsApi.getUnreadNotificationsCount error:', error)
      throw error
    }

    return count ?? 0
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) {
      console.error('notificationsApi.markNotificationAsRead error:', error)
      throw error
    }

    notifyNotificationsChanged()
  },

  async markAllNotificationsAsRead(): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)

    if (error) {
      console.error('notificationsApi.markAllNotificationsAsRead error:', error)
      throw error
    }

    notifyNotificationsChanged()
  },

  async getAppUpdates(): Promise<AppUpdate[]> {
    const { data, error } = await supabase
      .from('app_updates')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    if (error) {
      console.error('notificationsApi.getAppUpdates error:', error)
      throw error
    }

    return (data || []) as AppUpdate[]
  },
}
