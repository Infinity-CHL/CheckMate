// # Получение списка заказоd
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/api/supabase'
import { ordersApi } from '../api/ordersApi'
import type { Order } from '@/entities/order/model/order.model'

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setOrders([])
        return
      }

      const activeOrders = await ordersApi.getActiveOrders(user.id)
      setOrders(activeOrders)
      console.log(orders.values)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки заказов')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()

    // Realtime подписка на изменения
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  return { orders, loading, error, refetch: fetchOrders }
}
