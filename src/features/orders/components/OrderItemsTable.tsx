// Таблица с товарами в заказе
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2 } from 'lucide-react'
import type { OrderItem } from '@/entities/order/model/order.model'

interface OrderItemsTableProps {
  items: OrderItem[]
  onRemoveItem?: (itemId: string) => void
  isAdmin?: boolean
}

export const OrderItemsTable = ({ items, onRemoveItem, isAdmin = false }: OrderItemsTableProps) => {
  const total = items.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Товар</TableHead>
            <TableHead className="text-center">Кол-во</TableHead>
            <TableHead className="text-right">Цена</TableHead>
            <TableHead className="text-right">Сумма</TableHead>
            {isAdmin && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.product?.name || 'Товар'}
                {item.product?.category && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({item.product.category})
                  </span>
                )}
              </TableCell>
              <TableCell className="text-center">{item.quantity}</TableCell>
              <TableCell className="text-right">{item.unit_price} ₽</TableCell>
              <TableCell className="text-right font-medium">{item.subtotal} ₽</TableCell>
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
          ))}
          <TableRow className="bg-muted/50">
            <TableCell colSpan={3} className="text-right font-bold">
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
