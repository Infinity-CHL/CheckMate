import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ChevronRight, Loader2, Megaphone } from 'lucide-react'

import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  notificationsApi,
  type AppNotification,
  type AppUpdate,
} from '@/features/notifications/api/notificationsApi'

type NotificationsTab = 'personal' | 'updates'

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const getNotificationTypeLabel = (type: string) => {
  if (type === 'order_transfer') {
    return 'Заказ'
  }

  if (type === 'app_update') {
    return 'Обновление'
  }

  return type
}

const getUpdateTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    news: 'Новость',
    patch: 'Патч',
    minor: 'Обновление',
    major: 'Важное',
    version: 'Версия',
  }

  return labels[type] ?? type
}

const getNotificationBadgeLabel = (notification: AppNotification) => {
  if (notification.type !== 'app_update') {
    return getNotificationTypeLabel(notification.type)
  }

  const updateType = notification.payload?.type

  return typeof updateType === 'string'
    ? getUpdateTypeLabel(updateType)
    : getNotificationTypeLabel(notification.type)
}

export const NotificationsPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<NotificationsTab>('personal')
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [updates, setUpdates] = useState<AppUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const unreadCount = notifications.filter((item) => !item.read_at).length

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        setLoading(true)
        const [nextNotifications, nextUpdates] = await Promise.all([
          notificationsApi.getNotifications(),
          notificationsApi.getAppUpdates(),
        ])

        if (isMounted) {
          setNotifications(nextNotifications)
          setUpdates(nextUpdates)
          setError(null)
        }
      } catch (err) {
        console.error('NotificationsPage load error:', err)

        if (isMounted) {
          setError('Не удалось загрузить уведомления')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleNotificationClick = async (notification: AppNotification) => {
    try {
      if (!notification.read_at) {
        const readAt = new Date().toISOString()

        setNotifications((currentNotifications) =>
          currentNotifications.map((item) =>
            item.id === notification.id ? { ...item, read_at: readAt } : item
          )
        )
        await notificationsApi.markNotificationAsRead(notification.id)
      }

      if (notification.type === 'order_transfer' && notification.order_id) {
        navigate(`/orders/${notification.order_id}`)
      }

      if (notification.type === 'app_update') {
        setActiveTab('updates')
      }
    } catch (err) {
      console.error('NotificationsPage notification click error:', err)
      setError('Не удалось обновить уведомление')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const readAt = new Date().toISOString()

      setNotifications((currentNotifications) =>
        currentNotifications.map((item) => ({ ...item, read_at: readAt }))
      )
      await notificationsApi.markAllNotificationsAsRead()
    } catch (err) {
      console.error('NotificationsPage mark all error:', err)
      setError('Не удалось отметить уведомления прочитанными')
    }
  }

  return (
    <div className="container mx-auto max-w-3xl p-3 pb-28 md:p-6 md:pb-8">
      <PageHeader title="Уведомления" backTo="/profile" />

      <div className="grid gap-3">
        <Card className="rounded-3xl border-white/70 bg-white/85 shadow-sm backdrop-blur">
          <CardContent className="p-2">
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/60 p-1">
              <button
                type="button"
                className={
                  activeTab === 'personal'
                    ? 'min-h-10 rounded-xl bg-background px-3 text-sm font-semibold shadow-sm'
                    : 'min-h-10 rounded-xl px-3 text-sm font-medium text-muted-foreground'
                }
                onClick={() => setActiveTab('personal')}
              >
                Личные
              </button>
              <button
                type="button"
                className={
                  activeTab === 'updates'
                    ? 'min-h-10 rounded-xl bg-background px-3 text-sm font-semibold shadow-sm'
                    : 'min-h-10 rounded-xl px-3 text-sm font-medium text-muted-foreground'
                }
                onClick={() => setActiveTab('updates')}
              >
                Обновления
              </button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <Card className="rounded-3xl border-white/70 bg-white/85 shadow-sm backdrop-blur">
            <CardContent className="flex min-h-40 items-center justify-center p-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : activeTab === 'personal' ? (
          <div className="grid gap-3">
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 justify-self-end rounded-2xl"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Прочитать все
              </Button>
            )}

            {notifications.length === 0 ? (
              <Card className="rounded-3xl border-white/70 bg-white/85 shadow-sm backdrop-blur">
                <CardContent className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Уведомлений пока нет
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => {
                const isUnread = !notification.read_at
                const canOpenOrder =
                  notification.type === 'order_transfer' &&
                  Boolean(notification.order_id)

                return (
                  <button
                    key={notification.id}
                    type="button"
                    className={
                      isUnread
                        ? 'rounded-3xl border border-primary/15 bg-primary/10 p-4 text-left shadow-sm'
                        : 'rounded-3xl border border-white/70 bg-white/80 p-4 text-left shadow-sm'
                    }
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {notification.title}
                            </p>
                            {notification.body && (
                              <p className="mt-1 break-words text-sm leading-snug text-muted-foreground">
                                {notification.body}
                              </p>
                            )}
                          </div>
                          {canOpenOrder && (
                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant={isUnread ? 'default' : 'secondary'}>
                            {getNotificationBadgeLabel(notification)}
                          </Badge>
                          {notification.table_number && (
                            <Badge variant="outline">
                              Стол №{notification.table_number}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {updates.length === 0 ? (
              <Card className="rounded-3xl border-white/70 bg-white/85 shadow-sm backdrop-blur">
                <CardContent className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Обновлений пока нет
                </CardContent>
              </Card>
            ) : (
              updates.map((update) => (
                <Card
                  key={update.id}
                  className="rounded-3xl border-white/70 bg-white/85 shadow-sm backdrop-blur"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                        <Megaphone className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{update.title}</p>
                        {update.body && (
                          <p className="mt-1 break-words text-sm leading-snug text-muted-foreground">
                            {update.body}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {getUpdateTypeLabel(update.type)}
                          </Badge>
                          {update.version && (
                            <Badge variant="outline">v{update.version}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(
                              update.published_at ?? update.created_at
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
