// Статусы заказов, варианты

export const ORDER_STATUS = {
  ACTIVE: 'active',
  PREPARING: 'preparing',
  READY: 'ready',
  PAID: 'paid',
  CANCELLED: 'cancelled'
} as const

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.ACTIVE]: 'Активен',
  [ORDER_STATUS.PREPARING]: 'Готовится',
  [ORDER_STATUS.READY]: 'Готов',
  [ORDER_STATUS.PAID]: 'Оплачен',
  [ORDER_STATUS.CANCELLED]: 'Отменён'
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [ORDER_STATUS.ACTIVE]: 'bg-yellow-500 hover:bg-yellow-600',
  [ORDER_STATUS.PREPARING]: 'bg-blue-500 hover:bg-blue-600',
  [ORDER_STATUS.READY]: 'bg-green-500 hover:bg-green-600',
  [ORDER_STATUS.PAID]: 'bg-gray-500 hover:bg-gray-600',
  [ORDER_STATUS.CANCELLED]: 'bg-red-500 hover:bg-red-600'
}
