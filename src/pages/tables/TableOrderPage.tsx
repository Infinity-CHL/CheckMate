import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { MenuItem } from '@/entities/menu/model/menu-item.model'
import { TABLE_STATUS } from '@/entities/table/constants/table.constants'
import type { RestaurantTable } from '@/entities/table/model/table.model'
import { getMenuItems } from '@/features/menu/api/menuApi'
import {
  createTableOrder,
  getOrderItems,
  getOpenOrderByTableId,
  saveOrderItems,
  updateOrderTotal,
  type LocalOrderItem,
  type TableOrder,
} from '@/features/table-order/api/tableOrderApi'
import { OrderReceiptItems } from '@/features/table-order/components/OrderReceiptItems'
import { getTableById, updateTableStatus } from '@/features/tables/api/tablesApi'
import { useAuth } from '@/features/auth/useAuth'
import {
  createOrderDraftId,
  readOrderDraft,
  removeOrderDraft,
  saveOrderDraft,
} from '@/features/table-order/lib/orderDraftStorage'

export const TableOrderPage = () => {
  const { tableId } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [table, setTable] = useState<RestaurantTable | null>(null)
  const [order, setOrder] = useState<TableOrder | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orderItems, setOrderItems] = useState<LocalOrderItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const draftSessionIdRef = useRef(createOrderDraftId())
  const isBrowserUnloadRef = useRef(false)

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
    const markBrowserUnload = () => {
      isBrowserUnloadRef.current = true
    }

    window.addEventListener('beforeunload', markBrowserUnload)

    return () => {
      window.removeEventListener('beforeunload', markBrowserUnload)
    }
  }, [])

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    const initOrder = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!tableId) {
          throw new Error('Стол не найден')
        }

        if (!user) {
          throw new Error('Пользователь не авторизован')
        }

        const selectedTable = await getTableById(tableId)
        const openOrder = await getOpenOrderByTableId(selectedTable.id)

        if (selectedTable.status === TABLE_STATUS.RESERVED) {
          throw new Error('Стол в резерве')
        }

        if (selectedTable.status === TABLE_STATUS.OCCUPIED && !openOrder) {
          throw new Error('Открытый заказ для занятого стола не найден')
        }

        const items = await getMenuItems()
        const currentOrderItems = openOrder
          ? await getOrderItems(openOrder.id)
          : []
        const canRestoreDraft =
          selectedTable.status === TABLE_STATUS.FREE && !openOrder
        const draft = canRestoreDraft
          ? readOrderDraft(selectedTable.id)
          : null

        if (!canRestoreDraft || currentOrderItems.length > 0) {
          removeOrderDraft(selectedTable.id)
        }

        setTable(selectedTable)
        setOrder(openOrder)
        setMenuItems(items)
        setOrderItems(currentOrderItems.length > 0 ? currentOrderItems : draft?.orderItems ?? [])
        setSearch(draft?.search ?? '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки заказа')
      } finally {
        setLoading(false)
      }
    }

    void initOrder()
  }, [isAuthLoading, tableId, user])

  useEffect(() => {
    if (loading || !table) {
      return
    }

    if (table.status !== TABLE_STATUS.FREE || order) {
      return
    }

    if (orderItems.length === 0 && !search.trim()) {
      removeOrderDraft(table.id)
      return
    }

    saveOrderDraft(table.id, {
      orderItems,
      search,
      sessionDraftId: draftSessionIdRef.current,
    })
  }, [loading, order, orderItems, search, table])

  useEffect(() => {
    return () => {
      if (
        table?.status === TABLE_STATUS.FREE &&
        !order &&
        !isBrowserUnloadRef.current
      ) {
        removeOrderDraft(table.id)
      }
    }
  }, [order, table])

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

      if (!table || !user) {
        throw new Error('Заказ не найден')
      }

      if (orderItems.length === 0) {
        throw new Error('Добавьте хотя бы одну позицию')
      }

      const currentOrder = order ?? await createTableOrder(user.id, table.id)

      await saveOrderItems(currentOrder.id, orderItems)
      await updateOrderTotal(currentOrder.id, totalAmount)
      await updateTableStatus(table.id, TABLE_STATUS.OCCUPIED)
      removeOrderDraft(table.id)

      navigate('/orders')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения заказа')
    } finally {
      setSaving(false)
      setShowSaveConfirmation(false)
    }
  }

  if (loading || isAuthLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error && !table) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Ошибка: {error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 pb-28 md:p-6 md:pb-6">
      <PageHeader
        title={`Заказ стола №${table?.number ?? '—'}`}
        backTo="/orders"
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

            <div className="sticky bottom-20 -mx-6 space-y-3 border-t bg-background p-4 md:static md:mx-0 md:border-t-0 md:p-0">
              <Button
                className="h-11 w-full"
                onClick={() => setShowSaveConfirmation(true)}
                disabled={saving || orderItems.length === 0}
              >
                {saving ? 'Сохранение...' : 'Сохранить заказ'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showSaveConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Сохранить заказ?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSaveConfirmation(false)}
                    disabled={saving}
                  >
                    Нет
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveOrder}
                    disabled={saving}
                  >
                    {saving ? 'Сохранение...' : 'Да'}
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
