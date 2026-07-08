import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  CheckCircle,
  ChevronRight,
  Info,
  Loader2,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react'

import { AppLoader } from '@/components/AppLoader'
import { PageHeader } from '@/components/PageHeader'
import { UserNiceAvatar } from '@/components/UserNiceAvatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ORDER_STATUS, isOrderClosed } from '@/entities/order/constants/order.constants'
import { formatDate } from '@/entities/order/lib/order.utils'
import { useAuth } from '@/features/auth/useAuth'
import {
  ordersApi,
  type TransferableUser,
} from '@/features/orders/api/ordersApi'
import { OrderItemsTable } from '@/features/orders/components/OrderItemsTable'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { useOrderDetails } from '@/features/orders/hooks/useOrderDetails'

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  waiter: 'Официант',
}

const gradeLabels: Record<string, string> = {
  intern: 'Стажер',
  assistant: 'Помощник',
  junior: 'Новичок',
  professional: 'Профессионал',
  expert_mentor: 'Эксперт-наставник',
}

const formatAmount = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value)

const getTransferUserName = (user: TransferableUser) =>
  user.full_name?.trim() || user.email || 'Сотрудник'

const getTransferUserSeed = (user: TransferableUser) =>
  user.id || user.email || getTransferUserName(user)

const getTransferMeta = (user: TransferableUser) =>
  [
    user.role ? roleLabels[user.role] ?? user.role : null,
    user.grade ? gradeLabels[user.grade] ?? user.grade : null,
  ]
    .filter(Boolean)
    .join(' · ')

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
  const { user, profile } = useAuth()
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [showTipsSheet, setShowTipsSheet] = useState(false)
  const [showTransferSheet, setShowTransferSheet] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [transferUsers, setTransferUsers] = useState<TransferableUser[]>([])
  const [selectedTransferUserId, setSelectedTransferUserId] = useState('')
  const [loadingTransferUsers, setLoadingTransferUsers] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null)
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

  const handleOpenTipsSheet = () => {
    setTipsValue(String(order?.tips_amount ?? 0))
    setTipsError(null)
    setTipsSaved(false)
    setShowTipsSheet(true)
  }

  const handleOpenTransferSheet = async () => {
    if (!user) {
      return
    }

    try {
      setShowTransferSheet(true)
      setLoadingTransferUsers(true)
      setTransferError(null)
      setSelectedTransferUserId('')

      const users = await ordersApi.getTransferableUsers(user.id)
      setTransferUsers(users)
    } catch (err) {
      setTransferError(
        err instanceof Error
          ? err.message
          : 'Не удалось загрузить список сотрудников'
      )
    } finally {
      setLoadingTransferUsers(false)
    }
  }

  const handleCloseTransferSheet = () => {
    if (transferring) {
      return
    }

    setShowTransferSheet(false)
    setTransferError(null)
    setSelectedTransferUserId('')
  }

  const handleTransferOrder = async () => {
    if (!order || !selectedTransferUserId) {
      return
    }

    try {
      setTransferring(true)
      setTransferError(null)

      await ordersApi.transferOrder(order.id, selectedTransferUserId)
      setShowTransferSheet(false)
      setTransferSuccess('Заказ передан')

      window.setTimeout(() => {
        navigate('/orders')
      }, 700)
    } catch (err) {
      setTransferError(
        err instanceof Error ? err.message : 'Не удалось передать заказ'
      )
    } finally {
      setTransferring(false)
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
      setShowTipsSheet(false)
    } catch (err) {
      console.error('OrderDetailsPage handleSaveTips error:', err)
      setTipsError(
        err instanceof Error ? err.message : 'Не удалось сохранить чаевые'
      )
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
        <p className="text-red-500">
          Ошибка: {error || 'Заказ не найден'}
        </p>
        <Button onClick={() => navigate(ordersBackTo)} className="mt-4">
          Вернуться к заказам
        </Button>
      </div>
    )
  }

  const canCloseOrder = order.status === ORDER_STATUS.OPEN
  const isClosedOrder = isOrderClosed(order.status)
  const canEditOrder = order.status === ORDER_STATUS.OPEN && !isClosedOrder
  const canUpdateOrder = isAdmin && order.status === ORDER_STATUS.OPEN
  const canTransferOrder =
    Boolean(user) &&
    order.status === ORDER_STATUS.OPEN &&
    order.waiter_id === user?.id
  const canDeleteOrder = order.status === ORDER_STATUS.OPEN
  const hasMoreActions = canUpdateOrder || canDeleteOrder
  const currentTipsAmount = order.tips_amount ?? 0
  const normalizedTipsValue = Math.max(Number(tipsValue) || 0, 0)
  const isTipsChanged = normalizedTipsValue !== currentTipsAmount
  const subtotalAmount = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )
  const discountPercent = order.discount_percent ?? 0
  const discountAmount = Math.round((subtotalAmount * discountPercent) / 100)
  const finalTotal =
    order.total_amount ?? Math.max(subtotalAmount - discountAmount, 0)

  return (
    <div className="container mx-auto max-w-4xl p-3 pb-44 md:p-6 md:pb-8">
      <PageHeader title="Детали заказа" backTo={ordersBackTo} />

      {transferSuccess && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {transferSuccess}
        </div>
      )}

      <div className="grid gap-3">
        <Card className="relative z-30 overflow-visible rounded-3xl border-white/70 bg-white/85 shadow-sm backdrop-blur">
          <CardContent className="overflow-visible p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-lg">
                  Заказ стола №{order.table?.number ?? '—'}
                </CardTitle>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(order.created_at)}
                  </span>
                </div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-sm font-semibold tabular-nums">
                №{order.table?.number ?? '—'}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {canEditOrder && (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 flex-1 rounded-2xl px-2 text-xs sm:flex-none sm:px-3 sm:text-sm"
                  onClick={() =>
                    navigate(`/orders/${order.id}/edit${location.search}`, {
                      state: { from: ordersBackTo },
                    })
                  }
                >
                  <Pencil className="mr-1.5 h-4 w-4" />
                  Редактировать
                </Button>
              )}
              {canTransferOrder && (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 flex-1 rounded-2xl px-2 text-xs sm:flex-none sm:px-3 sm:text-sm"
                  onClick={handleOpenTransferSheet}
                >
                  <Send className="mr-1.5 h-4 w-4" />
                  Передать заказ
                </Button>
              )}

              {hasMoreActions && (
                <div className="relative z-50">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-2xl"
                    onClick={() => setShowMoreActions((current) => !current)}
                    aria-label="Дополнительные действия"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>

                  {showMoreActions && (
                    <div className="absolute right-0 top-12 z-[120] w-[min(13rem,calc(100vw-2rem))] rounded-2xl border border-border/80 bg-background p-1.5 shadow-xl">
                      {canUpdateOrder && (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setShowMoreActions(false)
                            updateStatus(ORDER_STATUS.CANCELLED)
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                          Отменить заказ
                        </button>
                      )}
                      {canDeleteOrder && (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setShowMoreActions(false)
                            setShowDeleteConfirmation(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Удалить заказ
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/70 bg-white/85 shadow-sm backdrop-blur">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Состав заказа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <OrderItemsTable
              items={items}
              discountPercent={discountPercent}
              totalAmount={order.total_amount}
              onRemoveItem={isAdmin && canEditOrder ? removeItem : undefined}
              onUpdateItemStatus={canEditOrder ? updateItemStatus : undefined}
              isReadOnly={!canEditOrder}
              isAdmin={isAdmin}
              showSummary={false}
            />

            <div className="rounded-3xl border border-border/70 bg-background/70 p-3">
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3 text-muted-foreground">
                  <span>Подытог</span>
                  <span className="font-medium tabular-nums">
                    {formatAmount(subtotalAmount)} ₽
                  </span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex items-center justify-between gap-3 text-green-700">
                    <span>Скидка {discountPercent}%</span>
                    <span className="font-medium tabular-nums">
                      -{formatAmount(discountAmount)} ₽
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="flex items-center justify-between gap-3 rounded-2xl py-1 text-left"
                  disabled={!canEditOrder}
                  onClick={canEditOrder ? handleOpenTipsSheet : undefined}
                >
                  <span className="text-muted-foreground">Чаевые</span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium tabular-nums">
                      {formatAmount(currentTipsAmount)} ₽
                    </span>
                    {canEditOrder && (
                      <>
                        <span className="text-xs text-primary">Изменить</span>
                        <ChevronRight className="h-3.5 w-3.5 text-primary" />
                      </>
                    )}
                  </span>
                </button>
                <div className="mt-1 flex items-center justify-between gap-3 border-t border-border/70 pt-2 text-base font-semibold">
                  <span>Итого</span>
                  <span className="tabular-nums">{formatAmount(finalTotal)} ₽</span>
                </div>
              </div>

              {tipsSaved && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Чаевые сохранены
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {canCloseOrder && (
          <div className="flex items-start gap-2 rounded-3xl border border-blue-100 bg-blue-50/80 px-3 py-2.5 text-xs text-blue-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>После закрытия заказа его нельзя будет редактировать.</span>
          </div>
        )}
      </div>

      {canCloseOrder && (
        <div className="fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[90] md:sticky md:bottom-4 md:inset-x-auto md:mx-auto md:mt-4 md:max-w-md">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-2 shadow-xl backdrop-blur-xl">
            <Button
              type="button"
              className="h-14 w-full rounded-2xl border-transparent text-sm font-semibold shadow-md hover:opacity-95"
              style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
              }}
              onClick={() => setShowCloseConfirmation(true)}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Закрыть заказ
            </Button>
          </div>
        </div>
      )}

      {showTipsSheet && (
        <div className="fixed inset-0 z-[100] flex items-end bg-black/50 p-2 sm:items-center sm:justify-center sm:p-4">
          <div className="w-full rounded-3xl border border-white/70 bg-background p-4 shadow-xl sm:max-w-sm">
            <CardTitle className="text-lg">Чаевые</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Укажите сумму чаевых для этого заказа
            </p>

            <div className="mt-4">
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
                className="h-11"
              />
            </div>

            {tipsError && (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                <div className="font-medium">Не удалось сохранить чаевые</div>
                <div className="mt-1 text-xs">{tipsError}</div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
              <Button
                type="button"
                className={
                  tipsSaved
                    ? 'h-12 w-full rounded-2xl bg-green-600 text-white hover:bg-green-600 sm:w-auto sm:min-w-28'
                    : 'h-12 w-full rounded-2xl sm:w-auto sm:min-w-28'
                }
                disabled={savingTips || (!isTipsChanged && !tipsSaved)}
                onClick={handleSaveTips}
              >
                {savingTips && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!savingTips && tipsSaved && (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {savingTips ? 'Сохранение...' : tipsSaved ? 'Сохранено' : 'Сохранить'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-2xl sm:w-auto sm:min-w-28"
                disabled={savingTips}
                onClick={() => setShowTipsSheet(false)}
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {showTransferSheet && (
        <div className="fixed inset-0 z-[100] flex items-end bg-black/50 p-2 sm:items-center sm:justify-center sm:p-4">
          <div className="max-h-[88vh] w-full overflow-y-auto rounded-3xl border border-white/70 bg-background p-4 shadow-xl sm:max-w-md">
            <div className="mb-4">
              <CardTitle className="text-lg">Передать заказ</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Выберите сотрудника, которому нужно передать этот заказ
              </p>
            </div>

            {loadingTransferUsers ? (
              <div className="flex min-h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : transferUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-3 py-8 text-center text-sm text-muted-foreground">
                Нет сотрудников, которым можно передать заказ
              </div>
            ) : (
              <div className="space-y-2">
                {transferUsers.map((transferUser) => {
                  const isSelected = selectedTransferUserId === transferUser.id
                  const meta = getTransferMeta(transferUser)

                  return (
                    <button
                      key={transferUser.id}
                      type="button"
                      className={
                        isSelected
                          ? 'flex w-full items-center gap-3 rounded-2xl border border-primary bg-primary/10 p-3 text-left'
                          : 'flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-background/80 p-3 text-left hover:bg-muted/70'
                      }
                      onClick={() => {
                        setSelectedTransferUserId(transferUser.id)
                        setTransferError(null)
                      }}
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-muted">
                        <UserNiceAvatar
                          seed={getTransferUserSeed(transferUser)}
                          size={44}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {getTransferUserName(transferUser)}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {transferUser.email || 'Почта не указана'}
                        </div>
                        {meta && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {meta}
                          </div>
                        )}
                      </div>
                      <span
                        className={
                          isSelected
                            ? 'h-3 w-3 rounded-full bg-primary'
                            : 'h-3 w-3 rounded-full border border-border'
                        }
                      />
                    </button>
                  )
                })}
              </div>
            )}

            {transferError && (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {transferError}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
              <Button
                type="button"
                className="h-12 w-full rounded-2xl text-sm sm:w-auto sm:min-w-36"
                disabled={
                  loadingTransferUsers ||
                  transferring ||
                  !selectedTransferUserId
                }
                onClick={handleTransferOrder}
              >
                {transferring && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {transferring ? 'Передача...' : 'Передать'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-2xl text-sm sm:w-auto sm:min-w-28"
                disabled={transferring}
                onClick={handleCloseTransferSheet}
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCloseConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Закрыть заказ?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  После закрытия стол станет свободным, а заказ попадет в историю.
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
