// Получение деталей заказа
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/api/supabase'
import { ordersApi } from '../api/ordersApi'
import type { Order, OrderItem } from '@/entities/order/model/order.model'
import type { OrderItemStatus } from '@/entities/order/constants/order-item.constants'
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
        () => {
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
    try {
      await ordersApi.updateOrderItemStatus(itemId, status)
      await fetchOrderDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления статуса позиции')
      throw err
    }
  }, [fetchOrderDetails])

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
