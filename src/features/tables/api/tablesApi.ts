import { supabase } from '@/shared/api/supabase'
import type { RestaurantTable } from '@/entities/table/model/table.model'
import type { TableStatus } from '@/entities/table/constants/table.constants'

export const getTables = async (): Promise<RestaurantTable[]> => {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('number', { ascending: true })

  if (error) throw error

  return data || []
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
