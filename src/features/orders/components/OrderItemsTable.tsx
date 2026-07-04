import { Check, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  ORDER_ITEM_STATUS,
  normalizeOrderItemStatus,
  type OrderItemStatus,
} from '@/entities/order/constants/order-item.constants'
import type { OrderItem } from '@/entities/order/model/order.model'
import { capitalizeFirstLetter, cn } from '@/lib/utils'

interface OrderItemsTableProps {
  items: OrderItem[]
  discountPercent?: number
  totalAmount?: number
  onRemoveItem?: (itemId: string) => void
  onUpdateItemStatus?: (itemId: string, status: OrderItemStatus) => void
  isReadOnly?: boolean
  isAdmin?: boolean
  showSummary?: boolean
}

const formatAmount = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value)

const ItemServedCheckbox = ({
  checked,
  disabled,
  onClick,
}: {
  checked: boolean
  disabled: boolean
  onClick?: () => void
}) => {
  return (
    <button
      type="button"
      aria-label={checked ? 'Отметить как готовится' : 'Отметить как выдано'}
      aria-pressed={checked}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
        checked
          ? 'bg-primary/10 text-primary'
          : 'bg-muted/70 text-muted-foreground',
        disabled ? 'cursor-default opacity-80' : 'hover:bg-primary/15'
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <span
        className={cn(
          'flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border',
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background'
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
    </button>
  )
}

export const OrderItemsTable = ({
  items,
  discountPercent = 0,
  totalAmount,
  onRemoveItem,
  onUpdateItemStatus,
  isReadOnly = false,
  isAdmin = false,
  showSummary = true,
}: OrderItemsTableProps) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const discountAmount = Math.round((subtotal * discountPercent) / 100)
  const finalTotal = totalAmount ?? Math.max(subtotal - discountAmount, 0)

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/80 bg-background/70 px-3 py-8 text-center">
        <p className="text-muted-foreground">Позиции не добавлены</p>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-border/70 bg-white/80 shadow-sm">
      <div className="divide-y divide-border/70">
        {items.map((item) => {
          const status = normalizeOrderItemStatus(item.status)
          const isServed = status === ORDER_ITEM_STATUS.SERVED
          const itemTotal = item.price * item.quantity
          const itemName = capitalizeFirstLetter(item.menu_item?.name) || 'Товар'
          const canUpdateStatus = !isReadOnly && Boolean(onUpdateItemStatus)

          return (
            <div key={item.id} className="min-w-0 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <ItemServedCheckbox
                  checked={isServed}
                  disabled={!canUpdateStatus}
                  onClick={
                    canUpdateStatus
                      ? () =>
                          onUpdateItemStatus?.(
                            item.id,
                            isServed
                              ? ORDER_ITEM_STATUS.PREPARING
                              : ORDER_ITEM_STATUS.SERVED
                          )
                      : undefined
                  }
                />

                <span
                  className="min-w-0 flex-1 overflow-hidden text-sm font-semibold leading-snug"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {itemName}
                </span>

                <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
                  <span className="shrink-0 rounded-xl bg-blue-50 px-2 py-1 text-sm font-semibold text-blue-600 tabular-nums">
                    x{item.quantity}
                  </span>

                  <span className="min-w-[64px] shrink-0 whitespace-nowrap text-right text-sm font-semibold tabular-nums text-slate-900">
                    {formatAmount(itemTotal)} ₽
                  </span>
                </div>
              </div>

              {item.note?.trim() && (
                <p className="mt-1 min-w-0 break-words pl-10 text-xs leading-snug text-muted-foreground">
                  {item.note}
                </p>
              )}

              {isAdmin && (
                <div className="mt-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveItem?.(item.id)}
                    aria-label={`Удалить ${itemName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showSummary && (
        <div className="border-t border-border/80 bg-white/70 p-3">
          <div className="grid min-w-0 gap-1.5 text-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-muted-foreground">
              <span>Подытог</span>
              <span className="whitespace-nowrap text-right tabular-nums">
                {formatAmount(subtotal)} ₽
              </span>
            </div>

            {discountPercent > 0 && (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-green-700">
                <span>Скидка {discountPercent}%</span>
                <span className="whitespace-nowrap text-right tabular-nums">
                  -{formatAmount(discountAmount)} ₽
                </span>
              </div>
            )}

            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 font-semibold">
              <span>Итого</span>
              <span className="whitespace-nowrap text-right tabular-nums">
                {formatAmount(finalTotal)} ₽
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
