// Карточка заказа (для списка)
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from './OrderStatusBadge'
import { formatDate } from '@/entities/order/lib/order.utils'
import type { Order } from '@/entities/order/model/order.model'

interface OrderCardProps {
  order: Order
}

export const OrderCard = ({ order }: OrderCardProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/orders/${order.id}`)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">
          Стол №{order.table_number}
        </CardTitle>
        <OrderStatusBadge status={order.status} />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              {formatDate(order.created_at)}
            </p>
            {order.comment && (
              <p className="text-sm mt-1 line-clamp-2">{order.comment}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{order.total_amount} ₽</p>
            <Button variant="ghost" size="sm" className="mt-1">
              Подробнее →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
