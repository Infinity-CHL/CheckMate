import { Minus, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { LocalOrderItem } from '@/features/table-order/api/tableOrderApi'

type OrderReceiptItemsProps = {
  items: LocalOrderItem[]
  totalAmount: number
  onQuantityChange: (menuItemId: string, quantity: number) => void
  onNoteChange: (menuItemId: string, note: string) => void
  onRemoveItem: (menuItemId: string) => void
}

const formatAmount = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value)

export const OrderReceiptItems = ({
  items,
  totalAmount,
  onQuantityChange,
  onNoteChange,
  onRemoveItem,
}: OrderReceiptItemsProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Позиции не добавлены</p>
      </div>
    )
  }

  return (
    <div className="border border-dashed bg-background">
      <div className="divide-y divide-dashed">
        {items.map((item) => {
          const itemTotal = item.price * item.quantity

          return (
            <div key={item.menuItem.id} className="space-y-3 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-sm font-medium">
                  {item.menuItem.name}
                </div>
                <div className="shrink-0 text-sm font-semibold">
                  {formatAmount(itemTotal)} ₽
                </div>
              </div>

              {item.note && (
                <p className="text-xs text-muted-foreground">{item.note}</p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {item.quantity} × {formatAmount(item.price)} ₽
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-9 w-9"
                      onClick={() =>
                        onQuantityChange(item.menuItem.id, item.quantity - 1)
                      }
                      aria-label={`Уменьшить ${item.menuItem.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="min-w-8 px-2 text-center text-sm font-medium">
                      {item.quantity}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-9 w-9"
                      onClick={() =>
                        onQuantityChange(item.menuItem.id, item.quantity + 1)
                      }
                      aria-label={`Увеличить ${item.menuItem.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-9 w-9"
                    onClick={() => onRemoveItem(item.menuItem.id)}
                    aria-label={`Удалить ${item.menuItem.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Textarea
                placeholder="Комментарий к позиции"
                value={item.note ?? ''}
                className="min-h-16 text-xs"
                onChange={(event) =>
                  onNoteChange(item.menuItem.id, event.target.value)
                }
              />
            </div>
          )
        })}
      </div>

      <div className="border-t border-dashed p-3">
        <div className="flex items-center justify-between gap-3 text-sm font-semibold">
          <span>Итого:</span>
          <span>{formatAmount(totalAmount)} ₽</span>
        </div>
      </div>
    </div>
  )
}
