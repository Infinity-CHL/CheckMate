export const ORDER_ITEM_STATUS = {
  PREPARING: 'preparing',
  SERVED: 'served',
} as const

export type OrderItemStatus =
  typeof ORDER_ITEM_STATUS[keyof typeof ORDER_ITEM_STATUS]

export const ORDER_ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  [ORDER_ITEM_STATUS.PREPARING]: 'Готовится',
  [ORDER_ITEM_STATUS.SERVED]: 'Выдан',
}

export const normalizeOrderItemStatus = (
  status: string | null | undefined
): OrderItemStatus => {
  if (status === ORDER_ITEM_STATUS.SERVED || status === 'ready') {
    return ORDER_ITEM_STATUS.SERVED
  }

  return ORDER_ITEM_STATUS.PREPARING
}
