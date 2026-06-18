import { useState } from 'react'
import { MessageSquareMore, Minus, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { LocalOrderItem } from '@/features/table-order/api/tableOrderApi'
import { capitalizeFirstLetter } from '@/lib/utils'

type OrderReceiptItemsProps = {
  items: LocalOrderItem[]
  subtotalAmount: number
  discountPercent: number
  discountAmount: number
  totalAmount: number
  onQuantityChange: (itemKey: string, quantity: number) => void
  onNoteChange: (itemKey: string, note: string) => void
  onRemoveItem: (itemKey: string) => void
}

const formatAmount = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value)

const getOrderItemKey = (item: LocalOrderItem) => {
  const modifierKey = (item.selectedModifiers ?? [])
    .map((modifier) => modifier.optionId)
    .sort()
    .join('|')

  return modifierKey ? `${item.menuItem.id}:${modifierKey}` : item.menuItem.id
}

export const OrderReceiptItems = ({
  items,
  subtotalAmount,
  discountPercent,
  discountAmount,
  totalAmount,
  onQuantityChange,
  onNoteChange,
  onRemoveItem,
}: OrderReceiptItemsProps) => {
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>(
    {}
  )
  const itemsCount = items.length

  const toggleNote = (menuItemId: string) => {
    setExpandedNotes((current) => ({
      ...current,
      [menuItemId]: !current[menuItemId],
    }))
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-background/70 px-3 py-5 text-center shadow-sm">
        <p className="text-muted-foreground">Позиции не добавлены</p>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 rounded-2xl border border-dashed border-border/80 bg-background/70 shadow-sm">
      <div className="divide-y divide-dashed divide-border/80">
        {items.map((item) => {
          const itemKey = getOrderItemKey(item)
          const itemTotal = item.price * item.quantity
          const hasNote = Boolean(item.note?.trim())
          const isNoteExpanded = Boolean(expandedNotes[itemKey])

          return (
            <div key={itemKey} className="min-w-0 space-y-1.5 p-2">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-1.5">
                <div className="min-w-0 truncate text-[13px] font-medium leading-snug">
                  {capitalizeFirstLetter(item.menuItem.name)}
                </div>
                <div className="shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                  x{item.quantity}
                </div>
                <div className="shrink-0 whitespace-nowrap text-right text-[13px] font-semibold tabular-nums">
                  {formatAmount(itemTotal)} ₽
                </div>
              </div>

              <div className="flex min-w-0 items-center justify-between gap-1.5">
                <Button
                  type="button"
                  variant={hasNote ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  className="h-6 w-6"
                  onClick={() => toggleNote(itemKey)}
                  aria-label={`Комментарий к ${capitalizeFirstLetter(item.menuItem.name)}`}
                  aria-expanded={isNoteExpanded}
                  aria-pressed={hasNote}
                >
                  <MessageSquareMore className="h-3.5 w-3.5" />
                </Button>

                <div className="flex min-w-0 items-center gap-1">
                  <div className="flex shrink-0 items-center border bg-background">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6"
                      onClick={() =>
                        onQuantityChange(itemKey, item.quantity - 1)
                      }
                      aria-label={`Уменьшить ${capitalizeFirstLetter(item.menuItem.name)}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <div className="min-w-5 px-1 text-center text-xs font-medium tabular-nums">
                      {item.quantity}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6"
                      onClick={() =>
                        onQuantityChange(itemKey, item.quantity + 1)
                      }
                      aria-label={`Увеличить ${capitalizeFirstLetter(item.menuItem.name)}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveItem(itemKey)}
                    aria-label={`Удалить ${capitalizeFirstLetter(item.menuItem.name)}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {(item.selectedModifiers ?? []).length > 0 && (
                <div className="space-y-0.5 text-[11px] leading-snug text-muted-foreground">
                  {item.selectedModifiers?.map((modifier) => (
                    <div
                      key={`${modifier.groupId}:${modifier.optionId}`}
                      className="flex min-w-0 justify-between gap-2"
                    >
                      <span className="min-w-0 truncate">
                        {modifier.optionName}
                      </span>
                      {modifier.priceDelta > 0 && (
                        <span className="shrink-0 tabular-nums">
                          +{formatAmount(modifier.priceDelta)} в‚Ѕ
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isNoteExpanded && (
                <Textarea
                  placeholder="Комментарий к позиции"
                  value={item.note ?? ''}
                  className="min-h-8 resize-none bg-background/80 px-2 py-1 text-xs leading-snug"
                  onChange={(event) =>
                    onNoteChange(itemKey, event.target.value)
                  }
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-dashed border-border/80 bg-white/60 p-2.5">
        <div className="grid min-w-0 gap-1.5 text-[13px]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-muted-foreground">
            <span className="min-w-0 truncate">Подытог</span>
            <span className="whitespace-nowrap text-right tabular-nums">
              {formatAmount(subtotalAmount)} ₽
            </span>
          </div>

          {discountPercent > 0 && (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-green-700">
              <span className="min-w-0 truncate">Скидка {discountPercent}%</span>
              <span className="whitespace-nowrap text-right tabular-nums">
                -{formatAmount(discountAmount)} ₽
              </span>
            </div>
          )}

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 font-semibold">
            <span className="min-w-0 truncate">Итого · {itemsCount} поз.</span>
            <span className="whitespace-nowrap text-right tabular-nums">
              {formatAmount(totalAmount)} ₽
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
