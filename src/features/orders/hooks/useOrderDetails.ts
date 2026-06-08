// Получение деталей заказа
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/api/supabase'
import { ordersApi } from '../api/ordersApi'
import type { Order, OrderItem } from '@/entities/order/model/order.model'

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

  const addItem = useCallback(async (productId: string, quantity: number, unitPrice: number) => {
    if (!orderId) return

    try {
      await ordersApi.addOrderItem(orderId, { product_id: productId, quantity, unit_price: unitPrice })
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

  return { order, items, loading, error, updateStatus, addItem, removeItem, refetch: fetchOrderDetails }
}
