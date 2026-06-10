import { supabase } from '@/shared/api/supabase'
import type { MenuItem } from '@/entities/menu/model/menu-item.model'

export const getMenuItems = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error

  return data || []
}
