import { useState } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { useOrderDetails } from '@/features/orders/hooks/useOrderDetails'
import { OrderItemsTable } from '@/features/orders/components/OrderItemsTable'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, Pencil, Trash2, XCircle } from 'lucide-react'
import { ORDER_STATUS } from '@/entities/order/constants/order.constants'
import { formatDate } from '@/entities/order/lib/order.utils'
import { useAuth } from '@/features/auth/useAuth'

export const OrderDetailsPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    order,
    items,
    loading,
    error,
    updateStatus,
    closeOrder,
    removeItem,
    updateItemStatus,
    deleteOrder,
  } = useOrderDetails(orderId)
  const { profile } = useAuth()
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [closing, setClosing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isAdmin = profile?.role === 'admin'
  const backPath =
    (location.state as { from?: string } | null)?.from ||
    `/orders${location.search}`

  const handleCloseOrder = async () => {
    try {
      setClosing(true)
      await closeOrder()
      navigate(backPath)
    } catch (err) {
      console.error('OrderDetailsPage handleCloseOrder error:', err)
    } finally {
      setClosing(false)
    }
  }

  const handleDeleteOrder = async () => {
    try {
      setDeleting(true)
      await deleteOrder()
      navigate(backPath)
    } finally {
      setDeleting(false)
    }
  }

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
        <Button onClick={() => navigate(backPath)} className="mt-4">
          Вернуться к заказам
        </Button>
      </div>
    )
  }

  const canCloseOrder = order.status === ORDER_STATUS.OPEN
  const canEditOrder = order.status === ORDER_STATUS.OPEN
  const canUpdateOrder = isAdmin && order.status === ORDER_STATUS.OPEN

  return (
    <div className="container mx-auto p-4 pb-6 max-w-4xl md:p-6">
      <Button variant="ghost" onClick={() => navigate(backPath)} className="mb-4 h-11">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад к заказам
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                Заказ стола №{order.table?.number ?? '—'}
              </CardTitle>
              <div className="flex gap-2 items-center">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm text-muted-foreground">
                  {formatDate(order.created_at)}
                </span>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              {canEditOrder && <Button className="h-11" onClick={() => navigate(`/orders/${order.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать заказ
              </Button>}
              {canUpdateOrder && (
                <>
                  <Button className="h-11" onClick={() => setShowCloseConfirmation(true)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Закрыть заказ
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-11"
                    onClick={() => updateStatus(ORDER_STATUS.CANCELLED)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Отменить заказ
                  </Button>
                </>
              )}
              {!isAdmin && canCloseOrder && (
                <Button className="h-11" onClick={() => setShowCloseConfirmation(true)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Закрыть заказ
                </Button>
              )}
              <Button
                variant="destructive"
                className="h-11"
                onClick={() => setShowDeleteConfirmation(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить заказ
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-3">Состав заказа</h3>
          <OrderItemsTable
            items={items}
            onRemoveItem={isAdmin ? removeItem : undefined}
            onUpdateItemStatus={canEditOrder ? updateItemStatus : undefined}
            isReadOnly={!canEditOrder}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>

      {showCloseConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Закрыть заказ?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  После закрытия стол станет свободным, а заказ попадёт в историю.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCloseConfirmation(false)}
                    disabled={closing}
                  >
                    Нет
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCloseOrder}
                    disabled={closing}
                  >
                    {closing ? 'Закрытие...' : 'Да'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Удалить заказ?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteConfirmation(false)}
                    disabled={deleting}
                  >
                    Нет
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteOrder}
                    disabled={deleting}
                  >
                    {deleting ? 'Удаление...' : 'Да'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
