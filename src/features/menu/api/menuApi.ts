import { supabase } from '@/shared/api/supabase'
import type {
  MenuItem,
  ModifierGroup,
  ModifierOption,
} from '@/entities/menu/model/menu-item.model'

type ModifierOptionRow = ModifierOption & {
  group_id: string
  price?: number | null
}

const normalizeModifierOption = (
  option: ModifierOptionRow
): ModifierOption => ({
  id: option.id,
  group_id: option.group_id,
  name: option.name,
  price: option.price ?? 0,
  sort_order: option.sort_order,
  created_at: option.created_at,
  updated_at: option.updated_at,
  modifier_group_id: option.group_id,
  price_delta: option.price ?? 0,
})

export const getMenuItems = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true })

  if (error) throw error

  return (data || []) as MenuItem[]
}

export const getActiveMenuItems = async (): Promise<MenuItem[]> => {
  return getMenuItems()
}

export const getModifiersForMenuItem = async (
  menuItemId: string
): Promise<ModifierGroup[]> => {
  const { data: groupsData, error: groupsError } = await supabase
    .from('modifier_groups')
    .select('id, menu_item_id, name, is_required, max_select, sort_order, created_at')
    .eq('menu_item_id', menuItemId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  if (groupsError) {
    if (import.meta.env.DEV) {
      console.error('[modifiers] fetch error', groupsError)
    }
    throw groupsError
  }

  const groups = (groupsData || []) as ModifierGroup[]
  const groupIds = groups.map((group) => group.id)

  if (groupIds.length === 0) {
    return []
  }

  const { data: optionsData, error: optionsError } = await supabase
    .from('modifier_options')
    .select('id, group_id, name, price, sort_order, created_at')
    .in('group_id', groupIds)
    .order('sort_order', { ascending: true, nullsFirst: false })

  if (optionsError) {
    if (import.meta.env.DEV) {
      console.error('[modifiers] fetch error', optionsError)
    }
    throw optionsError
  }

  const optionsByGroupId = new Map<string, ModifierOption[]>()

  ;((optionsData || []) as ModifierOptionRow[]).forEach((option) => {
    const normalizedOption = normalizeModifierOption(option)
    const currentOptions =
      optionsByGroupId.get(normalizedOption.group_id) ?? []

    currentOptions.push(normalizedOption)
    optionsByGroupId.set(normalizedOption.group_id, currentOptions)
  })

  return groups.map((group) => ({
    ...group,
    options: optionsByGroupId.get(group.id) ?? [],
    modifier_options: optionsByGroupId.get(group.id) ?? [],
  }))
}
