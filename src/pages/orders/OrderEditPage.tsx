import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { MenuItem } from '@/entities/menu/model/menu-item.model'
import type { RestaurantTable } from '@/entities/table/model/table.model'
import { ordersApi } from '@/features/orders/api/ordersApi'
import { getMenuItems } from '@/features/menu/api/menuApi'
import {
  saveOrderItems,
  updateOrderTotal,
  type LocalOrderItem,
  type TableOrder,
} from '@/features/table-order/api/tableOrderApi'
import { getTableById } from '@/features/tables/api/tablesApi'

export const OrderEditPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [table, setTable] = useState<RestaurantTable | null>(null)
  const [order, setOrder] = useState<TableOrder | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orderItems, setOrderItems] = useState<LocalOrderItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredMenuItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return []
    }

    return menuItems.filter((item) =>
      item.name.toLowerCase().includes(normalizedSearch)
    )
  }, [menuItems, search])

  const totalAmount = useMemo(
    () =>
      orderItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [orderItems]
  )

  useEffect(() => {
    const initOrder = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!orderId) {
          throw new Error('Заказ не найден')
        }

        const { order: currentOrder, items } = await ordersApi.getOrderDetails(orderId)
        const selectedTable = await getTableById(currentOrder.table_id)
        const menu = await getMenuItems()

        setOrder(currentOrder)
        setTable(selectedTable)
        setMenuItems(menu)
        setOrderItems(
          items.flatMap((item) => {
            if (!item.menu_item) {
              return []
            }

            return [{
              id: item.id,
              menuItem: item.menu_item,
              quantity: item.quantity,
              price: item.price,
              note: item.note,
              status: item.status as LocalOrderItem['status'],
            }]
          })
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки заказа')
      } finally {
        setLoading(false)
      }
    }

    void initOrder()
  }, [orderId])

  const handleAddItem = (menuItem: MenuItem) => {
    setOrderItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.menuItem.id === menuItem.id
      )

      if (existingItem) {
        return currentItems.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...currentItems,
        { menuItem, quantity: 1, price: menuItem.price, note: '' },
      ]
    })
    setSearch('')
  }

  const handleQuantityChange = (menuItemId: string, quantity: number) => {
    setOrderItems((currentItems) =>
      currentItems
        .map((item) =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity: Math.max(quantity, 0) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const handleNoteChange = (menuItemId: string, note: string) => {
    setOrderItems((currentItems) =>
      currentItems.map((item) =>
        item.menuItem.id === menuItemId ? { ...item, note } : item
      )
    )
  }

  const handleRemoveItem = (menuItemId: string) => {
    setOrderItems((currentItems) =>
      currentItems.filter((item) => item.menuItem.id !== menuItemId)
    )
  }

  const handleSaveOrder = async () => {
    try {
      setSaving(true)
      setError(null)

      if (!order) {
        throw new Error('Заказ не найден')
      }

      await saveOrderItems(order.id, orderItems)
      await updateOrderTotal(order.id, totalAmount)
      navigate(`/orders/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения заказа')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Ошибка: {error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 pb-28 md:p-6 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Редактирование заказа стола №{table?.number}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Измените позиции заказа и сохраните изменения.
        </p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-500">
          Ошибка: {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Меню</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              className="h-11"
              placeholder="Поиск блюда"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search.trim() ? (
              <div className="max-h-[60vh] overflow-y-auto border bg-background">
                {filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className="flex min-h-16 cursor-pointer items-center justify-between gap-3 border-b p-3 last:border-b-0 hover:bg-muted"
                      onClick={() => handleAddItem(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          handleAddItem(item)
                        }
                      }}
                    >
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {item.price} ₽
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="icon-sm"
                        className="h-10 w-10"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleAddItem(item)
                        }}
                        aria-label={`Добавить ${item.name}`}
                      >
                        +
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-muted-foreground">
                    Ничего не найдено
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Начните вводить название блюда</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Состав заказа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Позиции не добавлены</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[680px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Кол-во</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead className="w-[48px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.menuItem.id}>
                      <TableCell>
                        <div className="space-y-2">
                          <div>{item.menuItem.name}</div>
                          <Textarea
                            placeholder="Комментарий к позиции"
                            value={item.note ?? ''}
                            onChange={(event) =>
                              handleNoteChange(item.menuItem.id, event.target.value)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell>{item.price} ₽</TableCell>
                      <TableCell>
                        <Input
                          min={0}
                          type="number"
                          value={item.quantity}
                          className="w-16"
                          onChange={(event) =>
                            handleQuantityChange(
                              item.menuItem.id,
                              Number(event.target.value)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {item.price * item.quantity} ₽
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.menuItem.id)}
                          aria-label={`Удалить ${item.menuItem.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            )}

            <div className="sticky bottom-20 -mx-6 space-y-3 border-t bg-background p-4 md:static md:mx-0 md:border-t-0 md:p-0">
            <div className="flex items-center justify-between">
              <span className="font-medium">Итого</span>
              <span className="text-lg font-bold">{totalAmount} ₽</span>
            </div>

            <Button
              className="h-11 w-full"
              onClick={handleSaveOrder}
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
