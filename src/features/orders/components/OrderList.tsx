// Список заказов
import { OrderCard } from './OrderCard'
import type { Order } from '@/entities/order/model/order.model'

interface OrderListProps {
  orders: Order[]
}

export const OrderList = ({ orders }: OrderListProps) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Нет заказов</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
