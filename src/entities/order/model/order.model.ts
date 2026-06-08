// Типы и интерфейсы Order

import type { OrderStatus } from '@/entities/order/constants/order.constants'

export interface Order {
  id: string
  waiter_id: string
  table_number: number
  status: OrderStatus
  total_amount: number
  comment: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
  product?: {
    id: string
    name: string
    price: number
    category: string
  }
}

export interface CreateOrderData {
  table_number: number
  comment?: string
}

export interface CreateOrderItemData {
  product_id: string
  quantity: number
  unit_price: number
}
