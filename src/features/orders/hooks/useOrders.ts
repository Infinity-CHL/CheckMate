// # Получение списка заказоd
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/api/supabase'
import { ordersApi } from '../api/ordersApi'
import type { Order } from '@/entities/order/model/order.model'
import { useAuth } from '@/features/auth/useAuth'

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoading: isAuthLoading } = useAuth()

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)

      if (!user) {
        setOrders([])
        return
      }

      const orders = await ordersApi.getOrders(user.id)
      setOrders(orders)

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки заказов')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

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
  }, [fetchOrders, isAuthLoading])

  return { orders, loading, error, refetch: fetchOrders }
}
