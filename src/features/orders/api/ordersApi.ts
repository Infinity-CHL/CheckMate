import { supabase } from '@/shared/api/supabase'
import type { Order, OrderItem, CreateOrderData, CreateOrderItemData } from '@/entities/order/model/order.model'
import { ORDER_STATUS } from '@/entities/order/constants/order.constants'

export const ordersApi = {
  // Получить активные заказы (не оплаченные и не отменённые)
  async getActiveOrders(waiterId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('waiter_id', waiterId)
      .in('status', [ORDER_STATUS.ACTIVE, ORDER_STATUS.PREPARING, ORDER_STATUS.READY])
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Получить историю заказов (оплаченные и отменённые)
  async getOrderHistory(waiterId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('waiter_id', waiterId)
      .in('status', [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED])
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data || []
  },

  // Получить детали заказа с товарами
  async getOrderDetails(orderId: string): Promise<{ order: Order; items: OrderItem[] }> {
    // Сначала получаем заказ
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError

    // Получаем товары с информацией о продуктах
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products (
          id,
          name,
          price,
          category
        )
      `)
      .eq('order_id', orderId)

    if (itemsError) throw itemsError

    return { order, items: items || [] }
  },

  // Создать новый заказ
  async createOrder(waiterId: string, data: CreateOrderData): Promise<Order> {
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        waiter_id: waiterId,
        table_number: data.table_number,
        comment: data.comment || null,
        status: ORDER_STATUS.ACTIVE,
        total_amount: 0
      })
      .select()
      .single()

    if (error) throw error
    return order
  },

  // Добавить товар в заказ
  async addOrderItem(orderId: string, data: CreateOrderItemData): Promise<OrderItem> {
    const { data: item, error } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: data.product_id,
        quantity: data.quantity,
        unit_price: data.unit_price
      })
      .select()
      .single()

    if (error) throw error
    return item
  },

  // Обновить статус заказа
  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) throw error
  },

  // Удалить товар из заказа
  async removeOrderItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
  },

  // Обновить количество товара
  async updateOrderItemQuantity(itemId: string, quantity: number): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .update({ quantity })
      .eq('id', itemId)

    if (error) throw error
  }
}
