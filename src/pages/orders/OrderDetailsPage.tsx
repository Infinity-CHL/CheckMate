import { useEffect, useState } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { AppLoader } from '@/components/AppLoader'
import { useOrderDetails } from '@/features/orders/hooks/useOrderDetails'
import { OrderItemsTable } from '@/features/orders/components/OrderItemsTable'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CheckCircle, Loader2, Pencil, Trash2, XCircle } from 'lucide-react'
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
    updateTips,
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
  const [tipsValue, setTipsValue] = useState('0')
  const [savingTips, setSavingTips] = useState(false)
  const [tipsSaved, setTipsSaved] = useState(false)
  const [tipsError, setTipsError] = useState<string | null>(null)
  const isAdmin = profile?.role === 'admin'
  const ordersBackTo =
    (location.state as { from?: string } | null)?.from ||
    `/orders${location.search}`

  useEffect(() => {
    if (order) {
      setTipsValue(String(order.tips_amount ?? 0))
    }
  }, [order])

  useEffect(() => {
    if (!tipsSaved) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setTipsSaved(false)
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [tipsSaved])

  const handleCloseOrder = async () => {
    try {
      setClosing(true)
      await closeOrder()
      navigate(ordersBackTo)
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
      navigate(ordersBackTo)
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveTips = async () => {
    const normalizedTips = Math.max(Number(tipsValue) || 0, 0)

    try {
      setSavingTips(true)
      setTipsError(null)
      setTipsSaved(false)
      await updateTips(normalizedTips)
      setTipsValue(String(normalizedTips))
      setTipsSaved(true)
    } catch (err) {
      console.error('OrderDetailsPage handleSaveTips error:', err)
      setTipsError(err instanceof Error ? err.message : 'Не удалось сохранить чаевые')
    } finally {
      setSavingTips(false)
    }
  }

  if (loading) {
    return <AppLoader />
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Ошибка: {error || 'Заказ не найден'}</p>
        <Button onClick={() => navigate(ordersBackTo)} className="mt-4">
          Вернуться к заказам
        </Button>
      </div>
    )
  }

  const canCloseOrder = order.status === ORDER_STATUS.OPEN
  const canEditOrder = order.status === ORDER_STATUS.OPEN
  const canUpdateOrder = isAdmin && order.status === ORDER_STATUS.OPEN
  const normalizedTipsValue = Math.max(Number(tipsValue) || 0, 0)
  const currentTipsAmount = order.tips_amount ?? 0
  const isTipsChanged = normalizedTipsValue !== currentTipsAmount

  return (
    <div className="container mx-auto p-4 pb-6 max-w-4xl md:p-6">
      <PageHeader title="Детали заказа" backTo={ordersBackTo} />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="mb-2 text-lg">
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
              {canEditOrder && <Button
                className="h-11"
                onClick={() =>
                  navigate(`/orders/${order.id}/edit${location.search}`, {
                    state: { from: ordersBackTo },
                  })
                }
              >
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
          <div className="mb-5 rounded-3xl border border-border/70 bg-muted/30 p-3">
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <label htmlFor="tips_amount" className="text-sm font-semibold">
                    Чаевые
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Учитываются в зарплатной аналитике
                  </p>
                </div>
                {canEditOrder ? (
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Input
                      id="tips_amount"
                      type="number"
                      min={0}
                      step={1}
                      value={tipsValue}
                      onChange={(event) => {
                        setTipsValue(event.target.value)
                        setTipsError(null)
                        if (tipsSaved) {
                          setTipsSaved(false)
                        }
                      }}
                      className="h-11 sm:w-40"
                    />
                    <Button
                      type="button"
                      className={
                        tipsSaved
                          ? 'h-11 bg-green-600 text-white hover:bg-green-600'
                          : 'h-11'
                      }
                      disabled={savingTips || (!isTipsChanged && !tipsSaved)}
                      onClick={handleSaveTips}
                    >
                      {savingTips && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {!savingTips && tipsSaved && <CheckCircle className="mr-2 h-4 w-4" />}
                      {savingTips
                        ? 'Сохранение...'
                        : tipsSaved
                          ? 'Сохранено'
                          : 'Сохранить чаевые'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-lg font-semibold">
                    {order.tips_amount ?? 0} ₽
                  </div>
                )}
              </div>

              {tipsSaved && (
                <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Чаевые сохранены
                </div>
              )}

              {tipsError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  <div className="font-medium">Не удалось сохранить чаевые</div>
                  <div className="mt-1 text-xs">{tipsError}</div>
                </div>
              )}
            </div>
          </div>

          <h3 className="font-semibold mb-3">Состав заказа</h3>
          <OrderItemsTable
            items={items}
            discountPercent={order.discount_percent ?? 0}
            totalAmount={order.total_amount}
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
                <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
                  <Button
                    type="button"
                    className="h-12 w-full rounded-2xl text-sm sm:w-auto sm:min-w-28"
                    onClick={handleCloseOrder}
                    disabled={closing}
                  >
                    {closing ? 'Закрытие...' : 'Закрыть'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-2xl text-sm sm:w-auto sm:min-w-28"
                    onClick={() => setShowCloseConfirmation(false)}
                    disabled={closing}
                  >
                    Отмена
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
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-12 w-full rounded-2xl text-sm sm:w-auto sm:min-w-28"
                    onClick={handleDeleteOrder}
                    disabled={deleting}
                  >
                    {deleting ? 'Удаление...' : 'Удалить'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-2xl text-sm sm:w-auto sm:min-w-28"
                    onClick={() => setShowDeleteConfirmation(false)}
                    disabled={deleting}
                  >
                    Отмена
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
