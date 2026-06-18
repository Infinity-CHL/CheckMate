import { supabase } from '@/shared/api/supabase'
import type { MenuItem } from '@/entities/menu/model/menu-item.model'
import {
  ORDER_ITEM_STATUS,
  normalizeOrderItemStatus,
  type OrderItemStatus,
} from '@/entities/order/constants/order-item.constants'

export type TableOrderStatus = 'open' | 'closed' | 'cancelled'

export type TableOrder = {
  id: string
  table_id: string
  waiter_id: string
  status: TableOrderStatus
  total_amount: number
  tips_amount?: number | null
}

export type LocalOrderItem = {
  id?: string
  menuItem: MenuItem
  quantity: number
  price: number
  note?: string | null
  status?: OrderItemStatus | null
}

type OrderItemRow = {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
  note: string | null
  status: OrderItemStatus | null
}

export const getOpenOrderByTableId = async (
  tableId: string,
  waiterId: string
): Promise<TableOrder | null> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('table_id', tableId)
    .eq('waiter_id', waiterId)
    .eq('status', 'open')
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return data
}

export const createTableOrder = async (
  waiterId: string,
  tableId: string
): Promise<TableOrder> => {
  const existingOrder = await getOpenOrderByTableId(tableId, waiterId)

  if (existingOrder) {
    return existingOrder
  }

  const { data, error } = await supabase
    .from('orders')
    .insert({
      table_id: tableId,
      waiter_id: waiterId,
      status: 'open',
      total_amount: 0,
      tips_amount: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('createTableOrder error:', error)
    throw error
  }

  return data
}

export const getOrderItems = async (
  orderId: string
): Promise<LocalOrderItem[]> => {
  const { data: rows, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (error) {
    console.error('getOrderItems select error:', error)
    throw error
  }

  const orderItemRows = (rows || []) as OrderItemRow[]
  const menuItemIds = orderItemRows.map((item) => item.menu_item_id)

  if (menuItemIds.length === 0) {
    return []
  }

  const { data: menuItems, error: menuItemsError } = await supabase
    .from('menu_items')
    .select('*')
    .in('id', menuItemIds)

  if (menuItemsError) {
    console.error('getOrderItems menu_items select error:', menuItemsError)
    throw menuItemsError
  }

  const menuItemsById = new Map(
    ((menuItems || []) as MenuItem[]).map((item) => [item.id, item])
  )

  return orderItemRows.flatMap((item) => {
    const menuItem = menuItemsById.get(item.menu_item_id)

    if (!menuItem) {
      return []
    }

    return [{
      id: item.id,
      menuItem,
      quantity: item.quantity,
      price: item.price,
      note: item.note,
      status: normalizeOrderItemStatus(item.status),
    }]
  })
}

export const saveOrderItems = async (
  orderId: string,
  items: LocalOrderItem[]
): Promise<LocalOrderItem[]> => {
  if (!orderId) {
    const error = new Error('order_id is required before saving order_items')
    console.error('saveOrderItems validation error:', error)
    throw error
  }

  const { data: existingRows, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (error) {
    console.error('saveOrderItems existing select error:', error)
    throw error
  }

  const existingItems = (existingRows || []) as OrderItemRow[]
  const existingByMenuItemId = new Map(
    existingItems.map((item) => [item.menu_item_id, item])
  )
  const currentMenuItemIds = new Set(items.map((item) => item.menuItem.id))
  const itemsToDelete = existingItems.filter(
    (item) => !currentMenuItemIds.has(item.menu_item_id)
  )

  if (itemsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .in('id', itemsToDelete.map((item) => item.id))

    if (deleteError) {
      console.error('saveOrderItems delete error:', deleteError)
      throw deleteError
    }
  }

  for (const item of items) {
    const existingItem = existingByMenuItemId.get(item.menuItem.id)

    if (existingItem) {
      const { error: updateError } = await supabase
        .from('order_items')
        .update({
          quantity: item.quantity,
          price: item.price,
          note: item.note?.trim() || null,
          status: normalizeOrderItemStatus(item.status ?? existingItem.status),
        })
        .eq('id', existingItem.id)

      if (updateError) {
        console.error('saveOrderItems update error:', updateError)
        throw updateError
      }
      continue
    }

    const { error: insertError } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        price: item.price,
        note: item.note?.trim() || null,
        status: item.status
          ? normalizeOrderItemStatus(item.status)
          : ORDER_ITEM_STATUS.PREPARING,
      })

    if (insertError) {
      console.error('saveOrderItems insert error:', insertError)
      throw insertError
    }
  }

  return getOrderItems(orderId)
}

export const updateOrderTotal = async (
  orderId: string,
  totalAmount: number
): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ total_amount: totalAmount })
    .eq('id', orderId)

  if (error) {
    console.error('updateOrderTotal error:', error)
    throw error
  }
}

export const updateOrderTips = async (
  orderId: string,
  tipsAmount: number
): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ tips_amount: tipsAmount })
    .eq('id', orderId)

  if (error) {
    console.error('updateOrderTips error:', error)
    throw error
  }
}
