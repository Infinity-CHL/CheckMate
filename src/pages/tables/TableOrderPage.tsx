import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { capitalizeFirstLetter } from '@/lib/utils'
import type {
  MenuItem,
  ModifierGroup,
  SelectedModifier,
} from '@/entities/menu/model/menu-item.model'
import { TABLE_STATUS } from '@/entities/table/constants/table.constants'
import type { RestaurantTable } from '@/entities/table/model/table.model'
import { getMenuItems, getModifiersForMenuItem } from '@/features/menu/api/menuApi'
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
import { OrderEditSkeleton } from '@/shared/ui/skeletons'

const DISCOUNT_OPTIONS = [5, 10, 20]
type ModifierSheetMode = 'add' | 'edit'

const formatAmount = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value)

const getModifierGroupMaxSelect = (group: ModifierGroup) =>
  group.max_select ?? group.max_selected ?? 1

const isModifierGroupRequired = (group: ModifierGroup) => Boolean(group.is_required)

const getModifierGroupOptions = (group: ModifierGroup) =>
  group.options ?? group.modifier_options ?? []

const getModifierOptionPrice = (
  option: NonNullable<ModifierGroup['modifier_options']>[number]
) => option.price ?? option.price_delta ?? 0

const getOrderItemKey = (item: LocalOrderItem) => {
  const modifierKey = (item.selectedModifiers ?? [])
    .map((modifier) => modifier.optionId ?? modifier.modifier_option_id)
    .sort()
    .join('|')

  return modifierKey ? `${item.menuItem.id}:${modifierKey}` : item.menuItem.id
}

const getSelectedModifiersKey = (menuItemId: string, modifiers: SelectedModifier[]) => {
  const modifierKey = modifiers
    .map((modifier) => modifier.optionId ?? modifier.modifier_option_id)
    .sort()
    .join('|')

  return modifierKey ? `${menuItemId}:${modifierKey}` : menuItemId
}

const getSelectedModifierGroupOptions = (modifiers: SelectedModifier[] = []) =>
  modifiers.reduce<Record<string, string[]>>((acc, modifier) => {
    const groupId = modifier.groupId ?? modifier.group_id
    const optionId = modifier.optionId ?? modifier.modifier_option_id

    if (!groupId || !optionId) {
      return acc
    }

    acc[groupId] = [...(acc[groupId] ?? []), optionId]

    return acc
  }, {})

export const TableOrderPage = () => {
  const { tableId } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [table, setTable] = useState<RestaurantTable | null>(null)
  const [order, setOrder] = useState<TableOrder | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orderItems, setOrderItems] = useState<LocalOrderItem[]>([])
  const [discountPercent, setDiscountPercent] = useState(0)
  const [search, setSearch] = useState('')
  const [modifierMenuItem, setModifierMenuItem] = useState<MenuItem | null>(null)
  const [modifierSheetMode, setModifierSheetMode] =
    useState<ModifierSheetMode>('add')
  const [editingOrderItemKey, setEditingOrderItemKey] = useState<string | null>(
    null
  )
  const [modifierGroupsCache, setModifierGroupsCache] = useState<
    Record<string, ModifierGroup[]>
  >({})
  const [selectedModifierOptions, setSelectedModifierOptions] = useState<
    Record<string, string[]>
  >({})
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

  const subtotalAmount = useMemo(
    () =>
      orderItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [orderItems]
  )
  const discountAmount = useMemo(
    () => Math.round(subtotalAmount * discountPercent / 100),
    [discountPercent, subtotalAmount]
  )
  const totalAmount = Math.max(subtotalAmount - discountAmount, 0)
  const selectedModifiers = useMemo<SelectedModifier[]>(() => {
    if (!modifierMenuItem) {
      return []
    }

    return (modifierMenuItem.modifier_groups ?? []).flatMap((group) => {
      const selectedOptionIds = selectedModifierOptions[group.id] ?? []
      const options = getModifierGroupOptions(group)

      return selectedOptionIds.flatMap((optionId) => {
        const option = options.find(
          (modifierOption) => modifierOption.id === optionId
        )

        if (!option) {
          return []
        }

        return [{
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          priceDelta: getModifierOptionPrice(option),
          group_id: group.id,
          group_name: group.name,
          modifier_option_id: option.id,
          option_name: option.name,
          price: getModifierOptionPrice(option),
        }]
      })
    })
  }, [modifierMenuItem, selectedModifierOptions])
  const modifierItemPrice = modifierMenuItem
    ? modifierMenuItem.price +
      selectedModifiers.reduce(
        (total, modifier) => total + (modifier.priceDelta ?? modifier.price ?? 0),
        0
      )
    : 0
  const canAddModifierItem = modifierMenuItem
    ? (modifierMenuItem.modifier_groups ?? []).every((group) => {
        if (!isModifierGroupRequired(group)) {
          return true
        }

        return (selectedModifierOptions[group.id] ?? []).length > 0
      })
    : false

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
        setDiscountPercent(openOrder?.discount_percent ?? draft?.discountPercent ?? 0)
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
      discountPercent,
      sessionDraftId: draftSessionIdRef.current,
    })
  }, [discountPercent, loading, order, orderItems, search, table])

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

  const addOrderItem = (
    menuItem: MenuItem,
    selectedModifiersValue: SelectedModifier[] = []
  ) => {
    const itemKey = getSelectedModifiersKey(menuItem.id, selectedModifiersValue)
    const modifiersAmount = selectedModifiersValue.reduce(
      (total, modifier) => total + (modifier.priceDelta ?? modifier.price ?? 0),
      0
    )
    const itemPrice = menuItem.price + modifiersAmount

    setOrderItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => getOrderItemKey(item) === itemKey
      )

      if (existingItem) {
        return currentItems.map((item) =>
          getOrderItemKey(item) === itemKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...currentItems,
        {
          menuItem,
          quantity: 1,
          price: itemPrice,
          note: '',
          selectedModifiers: selectedModifiersValue,
        },
      ]
    })
    setSearch('')
  }

  const updateOrderItemModifiers = (
    itemKey: string,
    selectedModifiersValue: SelectedModifier[]
  ) => {
    setOrderItems((currentItems) => {
      const targetItem = currentItems.find(
        (item) => getOrderItemKey(item) === itemKey
      )

      if (!targetItem) {
        return currentItems
      }

      const modifiersAmount = selectedModifiersValue.reduce(
        (total, modifier) => total + (modifier.priceDelta ?? modifier.price ?? 0),
        0
      )
      const updatedItem: LocalOrderItem = {
        ...targetItem,
        price: targetItem.menuItem.price + modifiersAmount,
        selectedModifiers: selectedModifiersValue,
      }
      const updatedItemKey = getOrderItemKey(updatedItem)
      const matchingItem = currentItems.find(
        (item) =>
          getOrderItemKey(item) === updatedItemKey &&
          getOrderItemKey(item) !== itemKey
      )

      if (matchingItem) {
        return currentItems
          .map((item) =>
            getOrderItemKey(item) === updatedItemKey
              ? { ...item, quantity: item.quantity + updatedItem.quantity }
              : item
          )
          .filter((item) => getOrderItemKey(item) !== itemKey)
      }

      return currentItems.map((item) =>
        getOrderItemKey(item) === itemKey ? updatedItem : item
      )
    })
  }

  const handleAddItem = async (menuItem: MenuItem) => {
    try {
      setError(null)
      if (import.meta.env.DEV) {
        console.log('[modifiers] clicked item', menuItem.id, menuItem.name)
      }

      const cachedGroups = modifierGroupsCache[menuItem.id]
      const modifierGroups =
        cachedGroups ?? (await getModifiersForMenuItem(menuItem.id))

      if (import.meta.env.DEV) {
        console.log('[modifiers] groups', modifierGroups)
      }

      if (!cachedGroups) {
        setModifierGroupsCache((currentCache) => ({
          ...currentCache,
          [menuItem.id]: modifierGroups,
        }))
      }

      if (modifierGroups.length > 0) {
        if (import.meta.env.DEV) {
          modifierGroups.forEach((group) => {
            if (
              isModifierGroupRequired(group) &&
              getModifierGroupOptions(group).length === 0
            ) {
              console.error('[modifiers] required group has no options', group)
            }
          })
        }

        setModifierMenuItem({
          ...menuItem,
          modifier_groups: modifierGroups,
        })
        setModifierSheetMode('add')
        setEditingOrderItemKey(null)
        setSelectedModifierOptions({})
        return
      }

      addOrderItem(menuItem)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[modifiers] fetch error', err)
      }
      setError(
        err instanceof Error
          ? err.message
          : 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РјРѕРґРёС„РёРєР°С‚РѕСЂРѕРІ'
      )
    }
  }

  const handleAddItemClick = (menuItem: MenuItem) => {
    void handleAddItem(menuItem)
  }

  const handleAddItemKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    menuItem: MenuItem
  ) => {
    if (event.key === 'Enter') {
      handleAddItemClick(menuItem)
    }
  }

  const handleEditModifiers = async (itemKey: string) => {
    const orderItem = orderItems.find((item) => getOrderItemKey(item) === itemKey)

    if (!orderItem) {
      return
    }

    try {
      setError(null)
      const cachedGroups = modifierGroupsCache[orderItem.menuItem.id]
      const modifierGroups =
        cachedGroups ?? (await getModifiersForMenuItem(orderItem.menuItem.id))

      if (!cachedGroups) {
        setModifierGroupsCache((currentCache) => ({
          ...currentCache,
          [orderItem.menuItem.id]: modifierGroups,
        }))
      }

      if (modifierGroups.length === 0) {
        return
      }

      setModifierMenuItem({
        ...orderItem.menuItem,
        modifier_groups: modifierGroups,
      })
      setModifierSheetMode('edit')
      setEditingOrderItemKey(itemKey)
      setSelectedModifierOptions(
        getSelectedModifierGroupOptions(orderItem.selectedModifiers ?? [])
      )
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[modifiers] fetch error', err)
      }
      setError(
        err instanceof Error
          ? err.message
          : 'Ошибка загрузки модификаторов'
      )
    }
  }

  const handleModifierOptionChange = (
    group: ModifierGroup,
    optionId: string,
    checked: boolean
  ) => {
    const maxSelect = getModifierGroupMaxSelect(group)

    setSelectedModifierOptions((currentOptions) => {
      const currentGroupOptions = currentOptions[group.id] ?? []

      if (maxSelect === 1) {
        return {
          ...currentOptions,
          [group.id]: checked ? [optionId] : [],
        }
      }

      if (!checked) {
        return {
          ...currentOptions,
          [group.id]: currentGroupOptions.filter(
            (currentOptionId) => currentOptionId !== optionId
          ),
        }
      }

      if (currentGroupOptions.includes(optionId)) {
        return currentOptions
      }

      return {
        ...currentOptions,
        [group.id]: [...currentGroupOptions, optionId].slice(0, maxSelect),
      }
    })
  }

  const handleSaveModifierItem = () => {
    if (!modifierMenuItem || !canAddModifierItem) {
      return
    }

    if (modifierSheetMode === 'edit' && editingOrderItemKey) {
      updateOrderItemModifiers(editingOrderItemKey, selectedModifiers)
    } else {
      addOrderItem(modifierMenuItem, selectedModifiers)
    }

    setModifierMenuItem(null)
    setModifierSheetMode('add')
    setEditingOrderItemKey(null)
    setSelectedModifierOptions({})
  }

  const handleCloseModifierSheet = () => {
    setModifierMenuItem(null)
    setModifierSheetMode('add')
    setEditingOrderItemKey(null)
    setSelectedModifierOptions({})
  }

  useEffect(() => {
    if (!modifierMenuItem) {
      return
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModifierMenuItem(null)
        setModifierSheetMode('add')
        setEditingOrderItemKey(null)
        setSelectedModifierOptions({})
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => window.removeEventListener('keydown', handleEscape)
  }, [modifierMenuItem])

  const handleQuantityChange = (itemKey: string, quantity: number) => {
    setOrderItems((currentItems) =>
      currentItems
        .map((item) =>
          getOrderItemKey(item) === itemKey
            ? { ...item, quantity: Math.max(quantity, 0) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const handleNoteChange = (itemKey: string, note: string) => {
    setOrderItems((currentItems) =>
      currentItems.map((item) =>
        getOrderItemKey(item) === itemKey ? { ...item, note } : item
      )
    )
  }

  const handleRemoveItem = (itemKey: string) => {
    setOrderItems((currentItems) =>
      currentItems.filter((item) => getOrderItemKey(item) !== itemKey)
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
      await updateOrderTotal(currentOrder.id, totalAmount, discountPercent)
      removeOrderDraft(table.id)

      navigate(`/orders/${currentOrder.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения заказа')
    } finally {
      setSaving(false)
      setShowSaveConfirmation(false)
    }
  }

  if (loading || isAuthLoading) {
    return <OrderEditSkeleton />
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
                      onClick={() => handleAddItemClick(item)}
                      onKeyDown={(event) => handleAddItemKeyDown(event, item)}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {capitalizeFirstLetter(item.name)}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{item.price} ₽</span>
                          {(modifierGroupsCache[item.id]?.length ?? 0) > 0 && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                              Настроить
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="icon-sm"
                        className="h-8 w-8"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleAddItemClick(item)
                        }}
                        aria-label={`Добавить ${capitalizeFirstLetter(item.name)}`}
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
              subtotalAmount={subtotalAmount}
              discountPercent={discountPercent}
              discountAmount={discountAmount}
              totalAmount={totalAmount}
              onQuantityChange={handleQuantityChange}
              onNoteChange={handleNoteChange}
              onRemoveItem={handleRemoveItem}
              onEditModifiers={handleEditModifiers}
              canEditModifiers={(item) =>
                Boolean(
                  item.selectedModifiers?.length ||
                    item.menuItem.modifier_groups?.length ||
                    modifierGroupsCache[item.menuItem.id]?.length
                )
              }
            />
            <div className="rounded-2xl border border-border/70 bg-background/70 p-2">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Скидка
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {DISCOUNT_OPTIONS.map((discount) => (
                  <Button
                    key={discount}
                    type="button"
                    variant={discountPercent === discount ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 rounded-2xl"
                    onClick={() =>
                      setDiscountPercent((currentDiscount) =>
                        currentDiscount === discount ? 0 : discount
                      )
                    }
                  >
                    {discount}%
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-40 md:sticky md:bottom-4 md:inset-x-auto md:mx-auto md:mt-4 md:max-w-md">
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

      {modifierMenuItem && (
        <div
          className="fixed inset-0 z-[120] flex items-end bg-black/50 px-2 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-6 sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseModifierSheet}
        >
          <div
            className="flex max-h-[82vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/80 bg-white shadow-2xl sm:max-w-md sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-border/60 px-4 pb-3 pt-3">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
              <h2 className="text-lg font-semibold leading-tight">
                Настройка блюда
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {capitalizeFirstLetter(modifierMenuItem.name)}
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {(modifierMenuItem.modifier_groups ?? []).map((group) => {
                const maxSelect = getModifierGroupMaxSelect(group)
                const selectedOptions = selectedModifierOptions[group.id] ?? []
                const isRequired = isModifierGroupRequired(group)
                const isSingleSelect = maxSelect === 1
                const options = getModifierGroupOptions(group)

                return (
                  <div
                    key={group.id}
                    className="space-y-2 rounded-3xl border border-border/70 bg-background/70 p-3"
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {group.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isSingleSelect
                            ? 'Выберите 1'
                            : `Можно выбрать до ${maxSelect}`}
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        {isRequired ? 'Обязательно' : 'Необязательно'}
                      </span>
                    </div>

                    {options.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/80 bg-white/70 px-3 py-4 text-sm text-muted-foreground">
                        Нет доступных вариантов
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {options.map((option) => {
                        const isSelected = selectedOptions.includes(option.id)
                        const priceDelta = getModifierOptionPrice(option)

                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={[
                              'flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors',
                              isSelected
                                ? 'border-blue-300 bg-blue-50 text-blue-950'
                                : 'border-border/70 bg-background/80 hover:bg-muted/60',
                            ].join(' ')}
                            onClick={() =>
                              handleModifierOptionChange(
                                group,
                                option.id,
                                isSingleSelect ? true : !isSelected
                              )
                            }
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {option.name}
                              </span>
                              {priceDelta > 0 && (
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                  +{formatAmount(priceDelta)} ₽
                                </span>
                              )}
                            </span>

                            <span
                              className={[
                                'flex h-5 w-5 shrink-0 items-center justify-center border',
                                isSingleSelect ? 'rounded-full' : 'rounded-md',
                                isSelected
                                  ? 'border-blue-600 bg-blue-600'
                                  : 'border-slate-300 bg-white',
                              ].join(' ')}
                              aria-hidden="true"
                            >
                              {isSelected && (
                                <span
                                  className={[
                                    'block bg-white',
                                    isSingleSelect
                                      ? 'h-2 w-2 rounded-full'
                                      : 'h-2.5 w-2.5 rounded-sm',
                                  ].join(' ')}
                                />
                              )}
                            </span>
                          </button>
                        )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 gap-2 border-t border-border/70 bg-white/95 p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Итого</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatAmount(modifierItemPrice)} ₽
                </span>
              </div>
              <Button
                type="button"
                className="h-12 rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
                disabled={!canAddModifierItem}
                onClick={handleSaveModifierItem}
              >
                {modifierSheetMode === 'edit' ? 'Сохранить' : 'Добавить'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl"
                onClick={handleCloseModifierSheet}
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

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
