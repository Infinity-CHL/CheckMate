import { Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ORDER_ITEM_STATUS,
  ORDER_ITEM_STATUS_LABELS,
  normalizeOrderItemStatus,
  type OrderItemStatus,
} from '@/entities/order/constants/order-item.constants'
import type { OrderItem } from '@/entities/order/model/order.model'

interface OrderItemsTableProps {
  items: OrderItem[]
  discountPercent?: number
  totalAmount?: number
  onRemoveItem?: (itemId: string) => void
  onUpdateItemStatus?: (itemId: string, status: OrderItemStatus) => void
  isReadOnly?: boolean
  isAdmin?: boolean
}

const formatAmount = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value)

export const OrderItemsTable = ({
  items,
  discountPercent = 0,
  totalAmount,
  onRemoveItem,
  onUpdateItemStatus,
  isReadOnly = false,
  isAdmin = false,
}: OrderItemsTableProps) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const discountAmount = Math.round(subtotal * discountPercent / 100)
  const finalTotal = totalAmount ?? Math.max(subtotal - discountAmount, 0)

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/80 bg-background/70 px-3 py-8 text-center">
        <p className="text-muted-foreground">Позиции не добавлены</p>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-dashed border-border/80 bg-background/70 shadow-sm">
      <div className="divide-y divide-dashed divide-border/80">
        {items.map((item) => {
          const status = normalizeOrderItemStatus(item.status)
          const itemTotal = item.price * item.quantity

          return (
            <div key={item.id} className="min-w-0 space-y-2.5 p-3">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-2">
                <div className="min-w-0 truncate text-sm font-medium leading-snug">
                  {item.menu_item?.name || 'Товар'}
                </div>
                <div className="shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                  x{item.quantity}
                </div>
                <div className="shrink-0 whitespace-nowrap text-right text-sm font-semibold tabular-nums">
                  {formatAmount(itemTotal)} ₽
                </div>
              </div>

              {item.note?.trim() && (
                <p className="min-w-0 break-words text-xs leading-snug text-muted-foreground">
                  {item.note}
                </p>
              )}

              <div className="flex min-w-0 items-center justify-between gap-2">
                {isReadOnly || !onUpdateItemStatus ? (
                  <Badge variant="outline">{ORDER_ITEM_STATUS_LABELS[status]}</Badge>
                ) : (
                  <div className="flex min-w-0 flex-wrap gap-1.5">
                    {Object.values(ORDER_ITEM_STATUS).map((nextStatus) => (
                      <Button
                        key={nextStatus}
                        type="button"
                        size="xs"
                        variant={status === nextStatus ? 'default' : 'outline'}
                        onClick={() => onUpdateItemStatus(item.id, nextStatus)}
                        disabled={status === nextStatus}
                      >
                        {ORDER_ITEM_STATUS_LABELS[nextStatus]}
                      </Button>
                    ))}
                  </div>
                )}

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveItem?.(item.id)}
                    aria-label={`Удалить ${item.menu_item?.name || 'позицию'}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-dashed border-border/80 bg-white/60 p-3">
        <div className="grid min-w-0 gap-1.5 text-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-muted-foreground">
            <span>Подытог:</span>
            <span className="whitespace-nowrap text-right tabular-nums">
              {formatAmount(subtotal)} ₽
            </span>
          </div>

          {discountPercent > 0 && (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-green-700">
              <span>Скидка {discountPercent}%:</span>
              <span className="whitespace-nowrap text-right tabular-nums">
                -{formatAmount(discountAmount)} ₽
              </span>
            </div>
          )}

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 font-semibold">
            <span>Итого:</span>
            <span className="whitespace-nowrap text-right tabular-nums">
              {formatAmount(finalTotal)} ₽
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
