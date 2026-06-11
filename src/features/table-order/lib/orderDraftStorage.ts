import type { LocalOrderItem } from '@/features/table-order/api/tableOrderApi'

const ORDER_DRAFT_MAX_AGE = 2 * 60 * 60 * 1000

export type OrderDraft = {
  orderItems: LocalOrderItem[]
  search: string
  createdAt: number
  sessionDraftId: string
}

export const getOrderDraftKey = (tableId: string) =>
  `checkmate:order-draft:${tableId}`

export const createOrderDraftId = () => {
  if ('crypto' in window && 'randomUUID' in window.crypto) {
    return window.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const readOrderDraft = (tableId: string): OrderDraft | null => {
  const rawDraft = localStorage.getItem(getOrderDraftKey(tableId))

  if (!rawDraft) {
    return null
  }

  try {
    const draft = JSON.parse(rawDraft) as Partial<OrderDraft>

    if (
      !draft.createdAt ||
      !draft.sessionDraftId ||
      !Array.isArray(draft.orderItems) ||
      Date.now() - draft.createdAt > ORDER_DRAFT_MAX_AGE
    ) {
      removeOrderDraft(tableId)
      return null
    }

    return {
      orderItems: draft.orderItems,
      search: draft.search ?? '',
      createdAt: draft.createdAt,
      sessionDraftId: draft.sessionDraftId,
    }
  } catch {
    removeOrderDraft(tableId)
    return null
  }
}

export const saveOrderDraft = (
  tableId: string,
  draft: Omit<OrderDraft, 'createdAt'>
) => {
  localStorage.setItem(
    getOrderDraftKey(tableId),
    JSON.stringify({
      ...draft,
      createdAt: Date.now(),
    })
  )
}

export const removeOrderDraft = (tableId: string) => {
  localStorage.removeItem(getOrderDraftKey(tableId))
}
