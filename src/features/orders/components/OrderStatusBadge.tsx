// Бейдж статуса
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, type OrderStatus } from '@/entities/order/constants/order.constants'
import { Badge } from '@/components/ui/badge'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  return (
    <Badge className={`${ORDER_STATUS_COLORS[status]} text-white`}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  )
}
