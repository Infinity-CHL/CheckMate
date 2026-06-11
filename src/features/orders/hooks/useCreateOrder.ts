// Создание заказа
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersApi } from '@/features/orders/api/ordersApi'
import type { CreateOrderData } from '@/entities/order/model/order.model'
import { useAuth } from '@/features/auth/useAuth'

export const useCreateOrder = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const createOrder = async (data: CreateOrderData) => {
    try {
      setLoading(true)
      setError(null)

      if (!user) {
        throw new Error('Пользователь не авторизован')
      }

      const order = await ordersApi.createOrder(user.id, data)

      // Перенаправляем на страницу заказа для добавления товаров
      navigate(`/orders/${order.id}`)

      return order
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания заказа')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createOrder, loading, error }
}
