import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { MenuItem } from '@/entities/menu/model/menu-item.model'
import { ordersApi } from '@/features/orders/api/ordersApi'
import { getMenuItems } from '@/features/menu/api/menuApi'
import {
  saveOrderItems,
  updateOrderTotal,
  type LocalOrderItem,
  type TableOrder,
} from '@/features/table-order/api/tableOrderApi'
import { OrderReceiptItems } from '@/features/table-order/components/OrderReceiptItems'

export const OrderEditPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [order, setOrder] = useState<TableOrder | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orderItems, setOrderItems] = useState<LocalOrderItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ordersBackTo =
    (location.state as { from?: string } | null)?.from ||
    `/orders${location.search}`

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
        const menu = await getMenuItems()

        setOrder(currentOrder)
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
      navigate(`/orders/${order.id}${location.search}`, {
        state: { from: ordersBackTo },
      })
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
      <PageHeader
        title="Редактирование заказа"
        backTo={ordersBackTo}
      />

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
            <OrderReceiptItems
              items={orderItems}
              totalAmount={totalAmount}
              onQuantityChange={handleQuantityChange}
              onNoteChange={handleNoteChange}
              onRemoveItem={handleRemoveItem}
            />

            <div className="space-y-3 border-t bg-background md:static md:mx-0 md:border-t-0 md:p-0">
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
