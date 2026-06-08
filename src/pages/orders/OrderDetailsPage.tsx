import { useParams, useNavigate } from 'react-router-dom'
import { useOrderDetails } from '@/features/orders/hooks/useOrderDetails'
import { OrderItemsTable } from '@/features/orders/components/OrderItemsTable'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Truck, CheckCircle, CreditCard, XCircle } from 'lucide-react'
import { ORDER_STATUS } from '@/entities/order/constants/order.constants'
import { formatDate } from '@/entities/order/lib/order.utils'
import { supabase } from '@/shared/api/supabase'
import { useState, useEffect } from 'react'

export const OrderDetailsPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { order, items, loading, error, updateStatus, removeItem, refetch } = useOrderDetails(orderId)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        setIsAdmin(data?.role === 'admin')
      }
    }
    checkAdmin()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Ошибка: {error || 'Заказ не найден'}</p>
        <Button onClick={() => navigate('/orders')} className="mt-4">
          Вернуться к заказам
        </Button>
      </div>
    )
  }

  const statusActions = {
    [ORDER_STATUS.ACTIVE]: {
      nextStatus: ORDER_STATUS.PREPARING,
      label: 'Начать готовку',
      icon: Truck,
      variant: 'default'
    },
    [ORDER_STATUS.PREPARING]: {
      nextStatus: ORDER_STATUS.READY,
      label: 'Готов к выдаче',
      icon: CheckCircle,
      variant: 'default'
    },
    [ORDER_STATUS.READY]: {
      nextStatus: ORDER_STATUS.PAID,
      label: 'Оплачен',
      icon: CreditCard,
      variant: 'default'
    }
  }

  const action = statusActions[order.status as keyof typeof statusActions]

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад к заказам
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">
                Заказ стола №{order.table_number}
              </CardTitle>
              <div className="flex gap-2 items-center">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm text-muted-foreground">
                  {formatDate(order.created_at)}
                </span>
              </div>
            </div>
            {action && isAdmin && order.status !== ORDER_STATUS.PAID && order.status !== ORDER_STATUS.CANCELLED && (
              <Button onClick={() => updateStatus(action.nextStatus)}>
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            )}
            {isAdmin && order.status !== ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.PAID && (
              <Button
                variant="destructive"
                onClick={() => updateStatus(ORDER_STATUS.CANCELLED)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Отменить заказ
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {order.comment && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Комментарий:</p>
              <p className="text-sm">{order.comment}</p>
            </div>
          )}

          <h3 className="font-semibold mb-3">Состав заказа</h3>
          <OrderItemsTable
            items={items}
            onRemoveItem={isAdmin ? removeItem : undefined}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  )
}
