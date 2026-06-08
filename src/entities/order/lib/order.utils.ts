// Форматирование статусов, подсчёт суммы
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/entities/order/constants/order.constants'
import type { Order, OrderItem } from '@/entities/order/model/order.model'

export const getStatusLabel = (status: OrderStatus): string => {
  return ORDER_STATUS_LABELS[status] || status
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const calculateTotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.subtotal, 0)
}
