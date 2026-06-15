import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from './OrderStatusBadge'
import { ORDER_STATUS } from '@/entities/order/constants/order.constants'
import { formatDate } from '@/entities/order/lib/order.utils'
import type { Order } from '@/entities/order/model/order.model'

interface OrderCardProps {
  order: Order
}

const getOrdersStatus = (search: string) => {
  const status = new URLSearchParams(search).get('status')

  if (
    status === ORDER_STATUS.OPEN ||
    status === ORDER_STATUS.CLOSED ||
    status === 'all'
  ) {
    return status
  }

  return ORDER_STATUS.OPEN
}

const getScrollKey = (status: string) =>
  `checkmate:orders-scroll:${status}`

const getScrollY = () =>
  window.scrollY || document.scrollingElement?.scrollTop || 0

export const OrderCard = ({ order }: OrderCardProps) => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = () => {
    const from = `/orders${location.search}`
    const status = getOrdersStatus(location.search)
    const scrollState = {
      scrollY: getScrollY(),
      status,
      path: `${location.pathname}${location.search}`,
    }

    sessionStorage.setItem(getScrollKey(status), JSON.stringify(scrollState))

    navigate(`/orders/${order.id}${location.search}`, {
      state: { from },
    })
  }

  return (
    <Card
      className="min-h-32 cursor-pointer border-white/70 bg-white/80 transition-all hover:-translate-y-0.5 hover:shadow-md"
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="text-lg">
          Стол №{order.table?.number ?? '—'}
        </CardTitle>
        <OrderStatusBadge status={order.status} />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {formatDate(order.created_at)}
            </p>
            {order.status === ORDER_STATUS.CLOSED && order.closed_at && (
              <p className="text-sm text-muted-foreground">
                Закрыт: {formatDate(order.closed_at)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{order.total_amount} ₽</p>
            <Button variant="ghost" size="sm" className="mt-1 h-8">
              Подробнее →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
