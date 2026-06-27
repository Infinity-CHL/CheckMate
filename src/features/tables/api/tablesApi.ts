import { supabase } from '@/shared/api/supabase'
import type { RestaurantTable } from '@/entities/table/model/table.model'
import type { TableStatus } from '@/entities/table/constants/table.constants'
import { ORDER_STATUS } from '@/entities/order/constants/order.constants'
import { TABLE_STATUS } from '@/entities/table/constants/table.constants'

const REQUIRED_TABLES_COUNT = 20

type OpenTableOrderRow = {
  id: string
  table_id: string
}

export const getTables = async (): Promise<RestaurantTable[]> => {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('number', { ascending: true })

  if (error) throw error

  return data || []
}

export const ensureDefaultTables = async (): Promise<void> => {
  const tables = await getTables()
  const existingNumbers = new Set(tables.map((table) => table.number))
  const missingTables = Array.from({ length: REQUIRED_TABLES_COUNT }, (_, index) => index + 1)
    .filter((tableNumber) => !existingNumbers.has(tableNumber))
    .map((tableNumber) => ({
      number: tableNumber,
      seats: 4,
      status: TABLE_STATUS.FREE,
    }))

  if (missingTables.length === 0) {
    return
  }

  const { error } = await supabase
    .from('tables')
    .insert(missingTables)

  if (error) throw error
}

export const getOpenTableOrdersByWaiterId = async (
  waiterId: string
): Promise<Map<string, string>> => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, table_id')
    .eq('waiter_id', waiterId)
    .eq('status', ORDER_STATUS.OPEN)

  if (error) throw error

  return new Map(
    ((data || []) as OpenTableOrderRow[]).map((order) => [
      order.table_id,
      order.id,
    ])
  )
}

export const getTableById = async (tableId: string): Promise<RestaurantTable> => {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .single()

  if (error) throw error

  return data
}

export const getTableByNumber = async (
  tableNumber: number
): Promise<RestaurantTable> => {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('number', tableNumber)
    .single()

  if (error) throw error

  return data
}

export const updateTableStatus = async (
  tableId: string,
  status: TableStatus
): Promise<void> => {
  const { error } = await supabase
    .from('tables')
    .update({ status })
    .eq('id', tableId)

  if (error) throw error
}
