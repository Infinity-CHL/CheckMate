import { supabase } from '@/shared/api/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

const getSubscriptionKeys = (subscription: PushSubscription) => {
  const subscriptionJson = subscription.toJSON()

  return {
    p256dh: subscriptionJson.keys?.p256dh,
    auth: subscriptionJson.keys?.auth,
  }
}

export const pushNotificationsApi = {
  isPushSupported() {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  },

  getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied'
    }

    return Notification.permission
  },

  async registerServiceWorker() {
    if (!this.isPushSupported()) {
      throw new Error('Браузер не поддерживает push-уведомления')
    }

    return navigator.serviceWorker.register('/sw.js')
  },

  async getExistingSubscription() {
    if (!this.isPushSupported()) {
      return null
    }

    await this.registerServiceWorker()
    const registration = await navigator.serviceWorker.ready

    return registration.pushManager.getSubscription()
  },

  async subscribeToPush(userId: string) {
    if (!VAPID_PUBLIC_KEY) {
      throw new Error('VAPID public key не настроен')
    }

    if (!this.isPushSupported()) {
      throw new Error('Браузер не поддерживает push-уведомления')
    }

    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      throw new Error('Разрешение на уведомления не выдано')
    }

    const registration = await this.registerServiceWorker()
    const existingSubscription =
      await registration.pushManager.getSubscription()
    const subscription =
      existingSubscription ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }))

    await this.savePushSubscription(userId, subscription)

    return subscription
  },

  async savePushSubscription(userId: string, subscription: PushSubscription) {
    const { p256dh, auth } = getSubscriptionKeys(subscription)

    if (!p256dh || !auth) {
      throw new Error('Не удалось прочитать ключи push-подписки')
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    )

    if (error) {
      console.error('pushNotificationsApi.savePushSubscription error:', error)
      throw error
    }
  },

  async unsubscribeFromPush(userId: string) {
    const subscription = await this.getExistingSubscription()

    if (!subscription) {
      return
    }

    await subscription.unsubscribe()

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', subscription.endpoint)

    if (error) {
      console.error('pushNotificationsApi.unsubscribeFromPush error:', error)
      throw error
    }
  },
}
