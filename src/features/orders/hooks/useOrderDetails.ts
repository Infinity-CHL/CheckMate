// Получение деталей заказа
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/api/supabase'
import { ordersApi } from '../api/ordersApi'
import type { Order, OrderItem } from '@/entities/order/model/order.model'
import {
  normalizeOrderItemStatus,
  type OrderItemStatus,
} from '@/entities/order/constants/order-item.constants'
import { removeOrderDraft } from '@/features/table-order/lib/orderDraftStorage'

export const useOrderDetails = (orderId: string | undefined) => {
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return

    try {
      setLoading(true)
      const { order, items } = await ordersApi.getOrderDetails(orderId)
      setOrder(order)
      setItems(items)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки заказа')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrderDetails()

    // Realtime подписка на изменения в этом заказе
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new?.id) {
            const updatedItem = payload.new as Partial<OrderItem> & { id: string }

            setItems((currentItems) =>
              currentItems.map((item) =>
                item.id === updatedItem.id ? { ...item, ...updatedItem } : item
              )
            )
            return
          }

          fetchOrderDetails()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrderDetails, orderId])

  const updateStatus = useCallback(async (status: string) => {
    if (!orderId) return

    try {
      await ordersApi.updateOrderStatus(orderId, status)
      await fetchOrderDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления статуса')
    }
  }, [orderId, fetchOrderDetails])

  const updateTips = useCallback(async (tipsAmount: number) => {
    if (!orderId) return

    try {
      await ordersApi.updateOrderTips(orderId, tipsAmount)
      await fetchOrderDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения чаевых')
      throw err
    }
  }, [orderId, fetchOrderDetails])

  const closeOrder = useCallback(async () => {
    if (!orderId) return

    try {
      await ordersApi.closeOrder(orderId)
    } catch (err) {
      console.error('useOrderDetails.closeOrder error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка закрытия заказа')
      throw err
    }
  }, [orderId])

  const addItem = useCallback(async (menuItemId: string, quantity: number, price: number) => {
    if (!orderId) return

    try {
      await ordersApi.addOrderItem(orderId, { menu_item_id: menuItemId, quantity, price })
      await fetchOrderDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка добавления товара')
    }
  }, [orderId, fetchOrderDetails])

  const removeItem = useCallback(async (itemId: string) => {
    try {
      await ordersApi.removeOrderItem(itemId)
      await fetchOrderDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления товара')
    }
  }, [fetchOrderDetails])

  const updateItemStatus = useCallback(async (
    itemId: string,
    status: OrderItemStatus
  ) => {
    let previousStatus: OrderItemStatus | null = null

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        previousStatus = normalizeOrderItemStatus(item.status)

        return {
          ...item,
          status,
        }
      })
    )

    try {
      await ordersApi.updateOrderItemStatus(itemId, status)
    } catch (err) {
      if (previousStatus) {
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === itemId ? { ...item, status: previousStatus } : item
          )
        )
      }

      setError(err instanceof Error ? err.message : 'Ошибка обновления статуса позиции')
      throw err
    }
  }, [])

  const deleteOrder = useCallback(async () => {
    if (!orderId) return

    try {
      await ordersApi.deleteOrder(orderId)
      if (order?.table_id) {
        removeOrderDraft(order.table_id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления заказа')
      throw err
    }
  }, [order?.table_id, orderId])

  return { order, items, loading, error, updateStatus, updateTips, closeOrder, addItem, removeItem, updateItemStatus, deleteOrder, refetch: fetchOrderDetails }
}
