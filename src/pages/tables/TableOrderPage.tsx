import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { AppLoader } from '@/components/AppLoader'
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
import { getTableById } from '@/features/tables/api/tablesApi'
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
        const openOrder = await getOpenOrderByTableId(selectedTable.id, user.id)

        if (selectedTable.status === TABLE_STATUS.RESERVED) {
          throw new Error('Стол в резерве')
        }

        const items = await getMenuItems()
        const currentOrderItems = openOrder
          ? await getOrderItems(openOrder.id)
          : []
        const canRestoreDraft = !openOrder
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

    if (table.status === TABLE_STATUS.RESERVED || order) {
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
        table &&
        table.status !== TABLE_STATUS.RESERVED &&
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
    return <AppLoader />
  }

  if (error && !table) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Ошибка: {error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl p-3 pb-44 md:p-6 md:pb-8">
      <PageHeader
        title={`Заказ стола №${table?.number ?? '—'}`}
        backTo="/orders"
      />

      {error && (
        <div className="mb-4 text-sm text-red-500">
          Ошибка: {error}
        </div>
      )}

      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <Card size="sm" className="min-w-0 gap-2 overflow-visible">
          <CardHeader className="px-3">
            <CardTitle className="text-xs">Меню</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3">
            <Input
              className="h-8"
              placeholder="Поиск блюда"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search.trim() && (
              <div className="max-h-[48vh] overflow-y-auto rounded-2xl border border-border/80 bg-background/70 shadow-sm">
                {filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className="flex min-h-12 cursor-pointer items-center justify-between gap-2 border-b border-border/70 px-3 py-2 last:border-b-0 hover:bg-muted/70"
                      onClick={() => handleAddItem(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          handleAddItem(item)
                        }
                      }}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{item.name}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {item.price} ₽
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="icon-sm"
                        className="h-8 w-8"
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
            )}
          </CardContent>
        </Card>

        <Card size="sm" className="min-w-0 gap-2 overflow-visible">
          <CardHeader className="px-3">
            <CardTitle className="text-xs">Состав заказа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3">
            <OrderReceiptItems
              items={orderItems}
              totalAmount={totalAmount}
              onQuantityChange={handleQuantityChange}
              onNoteChange={handleNoteChange}
              onRemoveItem={handleRemoveItem}
            />
          </CardContent>
        </Card>
      </div>

      <div className="fixed inset-x-3 bottom-24 z-40 md:sticky md:bottom-4 md:inset-x-auto md:mx-auto md:mt-4 md:max-w-md">
        <div className="rounded-3xl border border-white/70 bg-background/85 p-2 shadow-lg backdrop-blur-xl">
          <Button
            className="h-11 w-full rounded-2xl"
            onClick={() => setShowSaveConfirmation(true)}
            disabled={saving || orderItems.length === 0}
          >
            {saving ? 'Сохранение...' : 'Сохранить заказ'}
          </Button>
        </div>
      </div>

      {showSaveConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Сохранить заказ?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
                  <Button
                    type="button"
                    className="h-12 w-full rounded-2xl text-sm sm:w-auto sm:min-w-28"
                    onClick={handleSaveOrder}
                    disabled={saving}
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-2xl text-sm sm:w-auto sm:min-w-28"
                    onClick={() => setShowSaveConfirmation(false)}
                    disabled={saving}
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
