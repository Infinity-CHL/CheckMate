import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ORDER_ITEM_STATUS,
  ORDER_ITEM_STATUS_LABELS,
  normalizeOrderItemStatus,
  type OrderItemStatus,
} from '@/entities/order/constants/order-item.constants'
import type { OrderItem } from '@/entities/order/model/order.model'
import { Trash2 } from 'lucide-react'

interface OrderItemsTableProps {
  items: OrderItem[]
  onRemoveItem?: (itemId: string) => void
  onUpdateItemStatus?: (itemId: string, status: OrderItemStatus) => void
  isReadOnly?: boolean
  isAdmin?: boolean
}

export const OrderItemsTable = ({
  items,
  onRemoveItem,
  onUpdateItemStatus,
  isReadOnly = false,
  isAdmin = false,
}: OrderItemsTableProps) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="min-w-[680px]">
        <TableHeader>
          <TableRow>
            <TableHead>Товар</TableHead>
            <TableHead className="text-center">Кол-во</TableHead>
            <TableHead className="text-right">Цена</TableHead>
            <TableHead className="text-right">Сумма</TableHead>
            <TableHead>Статус</TableHead>
            {isAdmin && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const status = normalizeOrderItemStatus(item.status)

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>
                      {item.menu_item?.name || 'Товар'}
                      {item.menu_item?.category && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({item.menu_item.category})
                        </span>
                      )}
                    </div>
                    {item.note?.trim() && (
                      <p className="mt-1 text-xs font-normal text-muted-foreground">
                        Комментарий: {item.note}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">{item.price} ₽</TableCell>
                <TableCell className="text-right font-medium">
                  {item.price * item.quantity} ₽
                </TableCell>
                <TableCell>
                  {isReadOnly || !onUpdateItemStatus ? (
                    <Badge variant="outline">
                      {ORDER_ITEM_STATUS_LABELS[status]}
                    </Badge>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {Object.values(ORDER_ITEM_STATUS).map((nextStatus) => (
                        <Button
                          key={nextStatus}
                          type="button"
                          size="sm"
                          variant={status === nextStatus ? 'default' : 'outline'}
                          onClick={() => onUpdateItemStatus(item.id, nextStatus)}
                          disabled={status === nextStatus}
                        >
                          {ORDER_ITEM_STATUS_LABELS[nextStatus]}
                        </Button>
                      ))}
                    </div>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem?.(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
          <TableRow className="bg-muted/50">
            <TableCell colSpan={4} className="text-right font-bold">
              Итого:
            </TableCell>
            <TableCell className="text-right font-bold">{total} ₽</TableCell>
            {isAdmin && <TableCell />}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
