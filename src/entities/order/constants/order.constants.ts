export const ORDER_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.OPEN]: 'Открыт',
  [ORDER_STATUS.CLOSED]: 'Закрыт',
  [ORDER_STATUS.CANCELLED]: 'Отменён',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [ORDER_STATUS.OPEN]: 'bg-yellow-500 hover:bg-yellow-600',
  [ORDER_STATUS.CLOSED]: 'bg-gray-500 hover:bg-gray-600',
  [ORDER_STATUS.CANCELLED]: 'bg-red-500 hover:bg-red-600',
}

export const isOrderClosed = (status: string | null | undefined) => {
  const normalizedStatus = status?.toLowerCase()

  return normalizedStatus === 'closed' || normalizedStatus === 'completed'
}
