import { supabase } from '@/shared/api/supabase'
import type { Order, OrderItem, CreateOrderData, CreateOrderItemData } from '@/entities/order/model/order.model'
import { ORDER_ITEM_STATUS, type OrderItemStatus } from '@/entities/order/constants/order-item.constants'
import { ORDER_STATUS } from '@/entities/order/constants/order.constants'

export type TransferableUser = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  grade: string | null
  is_active?: boolean | null
}

const ORDER_TRANSFER_RLS_ERROR =
  'Нет прав на передачу заказа. Нужно обновить RLS policy для orders.'

const isRlsError = (error: { code?: string; message?: string }) => {
  const message = error.message?.toLowerCase() ?? ''

  return (
    error.code === '42501' ||
    message.includes('row-level security') ||
    message.includes('permission denied')
  )
}

const getTransferableUserName = (user: TransferableUser) =>
  user.full_name?.trim() || user.email || 'Сотрудник'

export const ordersApi = {
  async getOrders(waiterId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, table:tables(id, number), order_items(id)')
      .eq('waiter_id', waiterId)
      .in('status', [ORDER_STATUS.OPEN, ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELLED])
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).filter(
      (order) => order.status !== ORDER_STATUS.OPEN || (order.order_items || []).length > 0
    )
  },

  async getActiveOrders(waiterId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, table:tables(id, number), order_items(id)')
      .eq('waiter_id', waiterId)
      .eq('status', ORDER_STATUS.OPEN)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).filter((order) => (order.order_items || []).length > 0)
  },

  async getOrderHistory(waiterId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, table:tables(id, number)')
      .eq('waiter_id', waiterId)
      .in('status', [ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELLED])
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data || []
  },

  async getOrderDetails(orderId: string): Promise<{ order: Order; items: OrderItem[] }> {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, table:tables(id, number)')
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*, menu_item:menu_items(id, name, price, category)')
      .eq('order_id', orderId)

    if (itemsError) throw itemsError

    return { order, items: items || [] }
  },

  async createOrder(waiterId: string, data: CreateOrderData): Promise<Order> {
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select('*, table:tables(id, number)')
      .eq('table_id', data.table_id)
      .eq('waiter_id', waiterId)
      .eq('status', ORDER_STATUS.OPEN)
      .limit(1)
      .maybeSingle()

    if (existingOrderError) throw existingOrderError

    if (existingOrder) {
      return existingOrder
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        waiter_id: waiterId,
        table_id: data.table_id,
        status: ORDER_STATUS.OPEN,
        total_amount: 0,
        discount_percent: 0,
        tips_amount: 0,
      })
      .select('*, table:tables(id, number)')
      .single()

    if (error) throw error
    return order
  },

  async addOrderItem(orderId: string, data: CreateOrderItemData): Promise<OrderItem> {
    const { data: item, error } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        menu_item_id: data.menu_item_id,
        quantity: data.quantity,
        price: data.price,
        status: ORDER_ITEM_STATUS.PREPARING,
      })
      .select('*, menu_item:menu_items(id, name, price, category)')
      .single()

    if (error) {
      console.error('ordersApi.addOrderItem insert error:', error)
      throw error
    }
    return item
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      console.error('ordersApi.updateOrderStatus update error:', error)
      throw error
    }
  },

  async updateOrderTips(orderId: string, tipsAmount: number): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ tips_amount: tipsAmount })
      .eq('id', orderId)

    if (error) {
      console.error('ordersApi.updateOrderTips update error:', error)
      throw error
    }
  },

  async getTransferableUsers(
    currentUserId: string
  ): Promise<TransferableUser[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('id', currentUserId)

    if (error) {
      console.error('ordersApi.getTransferableUsers select error:', error)
      throw error
    }

    return ((data || []) as TransferableUser[])
      .filter((user) => user.is_active !== false)
      .sort((firstUser, secondUser) =>
        getTransferableUserName(firstUser).localeCompare(
          getTransferableUserName(secondUser),
          'ru'
        )
      )
  },

  async transferOrder(
    orderId: string,
    targetUserId: string
  ): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ waiter_id: targetUserId })
      .eq('id', orderId)
      .select('*, table:tables(id, number)')
      .single()

    if (error) {
      console.error('ordersApi.transferOrder update error:', error)

      if (isRlsError(error)) {
        throw new Error(ORDER_TRANSFER_RLS_ERROR)
      }

      throw error
    }

    return data
  },

  async closeOrder(orderId: string): Promise<void> {
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        status: ORDER_STATUS.CLOSED,
        closed_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (orderUpdateError) {
      console.error('ordersApi.closeOrder order update error:', orderUpdateError)
      throw orderUpdateError
    }
  },

  async removeOrderItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('ordersApi.removeOrderItem delete error:', error)
      throw error
    }
  },

  async updateOrderItemQuantity(itemId: string, quantity: number): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .update({ quantity })
      .eq('id', itemId)

    if (error) {
      console.error('ordersApi.updateOrderItemQuantity update error:', error)
      throw error
    }
  },

  async updateOrderItemStatus(
    itemId: string,
    status: OrderItemStatus
  ): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .update({ status })
      .eq('id', itemId)

    if (error) {
      console.error('ordersApi.updateOrderItemStatus update error:', error)
      throw error
    }
  },

  async deleteOrder(orderId: string): Promise<void> {
    const { error: orderSelectError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .single()

    if (orderSelectError) {
      console.error('ordersApi.deleteOrder order select error:', orderSelectError)
      throw orderSelectError
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('ordersApi.deleteOrder order_items delete error:', itemsError)
      throw itemsError
    }

    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (orderError) {
      console.error('ordersApi.deleteOrder orders delete error:', orderError)
      throw orderError
    }
  },
}
