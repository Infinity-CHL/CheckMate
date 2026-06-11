import type { MenuItem } from '@/entities/menu/model/menu-item.model'
import type { OrderStatus } from '@/entities/order/constants/order.constants'
import type { OrderItemStatus } from '@/entities/order/constants/order-item.constants'

export interface Order {
  id: string
  table_id: string
  waiter_id: string
  status: OrderStatus
  total_amount: number
  created_at: string
  closed_at: string | null
  table?: {
    id: string
    number: number
  } | null
  order_items?: Array<{
    id: string
  }>
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
  note: string | null
  status: OrderItemStatus | string | null
  menu_item?: MenuItem | null
}

export interface CreateOrderData {
  table_id: string
}

export interface CreateOrderItemData {
  menu_item_id: string
  quantity: number
  price: number
}
