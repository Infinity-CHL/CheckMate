self.addEventListener('push', (event) => {
  let payload = {}

  if (event.data) {
    try {
      payload = event.data.json()
    } catch (error) {
      payload = {
        title: 'CheckMate',
        body: event.data.text(),
      }
    }
  }

  const targetUrl =
    payload.url ||
    (payload.order_id ? `/orders/${payload.order_id}` : '/notifications')
  const title = payload.title || 'Новое уведомление'
  const options = {
    body: payload.body || 'Откройте приложение',
    data: {
      url: targetUrl,
      order_id: payload.order_id,
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const targetUrl = data.url || '/notifications'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const absoluteUrl = new URL(targetUrl, self.location.origin).href

      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            return client.navigate(absoluteUrl).then((navigatedClient) => {
              return navigatedClient ? navigatedClient.focus() : client.focus()
            })
          }

          return client.focus()
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }

      return undefined
    })
  )
})
