import type { TableStatus } from '@/entities/table/constants/table.constants'

export interface RestaurantTable {
  id: string
  number: number
  status: TableStatus
  seats?: number | null
  created_at?: string
  updated_at?: string
}
