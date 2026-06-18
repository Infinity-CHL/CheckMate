import { supabase } from '@/shared/api/supabase'
import type {
  MenuItem,
  ModifierGroup,
  ModifierOption,
} from '@/entities/menu/model/menu-item.model'

type ModifierOptionRow = ModifierOption & {
  price?: number | null
}

const normalizeModifierOption = (
  option: ModifierOptionRow
): ModifierOption => ({
  id: option.id,
  modifier_group_id: option.modifier_group_id,
  name: option.name,
  price_delta: option.price_delta ?? option.price ?? 0,
  is_active: option.is_active,
  created_at: option.created_at,
  updated_at: option.updated_at,
})

export const getMenuItems = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error

  return (data || []) as MenuItem[]
}

export const getActiveMenuItems = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error

  return (data || []) as MenuItem[]
}

export const getModifiersForMenuItem = async (
  menuItemId: string
): Promise<ModifierGroup[]> => {
  const { data: groupsData, error: groupsError } = await supabase
    .from('modifier_groups')
    .select('*')
    .eq('menu_item_id', menuItemId)

  if (groupsError) throw groupsError

  const groups = ((groupsData || []) as ModifierGroup[]).sort(
    (firstGroup, secondGroup) =>
      (firstGroup.sort_order ?? 0) - (secondGroup.sort_order ?? 0)
  )
  const groupIds = groups.map((group) => group.id)

  if (groupIds.length === 0) {
    return []
  }

  const { data: optionsData, error: optionsError } = await supabase
    .from('modifier_options')
    .select('*')
    .in('modifier_group_id', groupIds)
    .order('created_at', { ascending: true })

  if (optionsError) throw optionsError

  const optionsByGroupId = new Map<string, ModifierOption[]>()

  ;((optionsData || []) as ModifierOptionRow[]).forEach((option) => {
    const normalizedOption = normalizeModifierOption(option)
    const currentOptions =
      optionsByGroupId.get(normalizedOption.modifier_group_id) ?? []

    currentOptions.push(normalizedOption)
    optionsByGroupId.set(normalizedOption.modifier_group_id, currentOptions)
  })

  return groups.map((group) => ({
    ...group,
    modifier_options: optionsByGroupId.get(group.id) ?? [],
  }))
}
