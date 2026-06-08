import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { OrderList } from '@/features/orders/components/OrderList'
import { OrderFilters } from '@/features/orders/components/OrderFilters'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { OrderStatus } from '@/entities/order/constants/order.constants'

export const OrdersPage = () => {
  const { orders, loading, error } = useOrders()
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Ошибка: {error}</p>
      </div>
    )
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter)

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Активные заказы</h1>
        <Button onClick={() => navigate('/orders/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Создать заказ
        </Button>
      </div>

      <OrderFilters activeFilter={filter} onFilterChange={setFilter} />
      <OrderList orders={filteredOrders} />
    </div>
  )
}
