import type {
  ModifierGroup,
  ModifierOption,
  SelectedModifier,
} from '@/entities/menu/model/menu-item.model'
import { supabase } from '@/shared/api/supabase'

type OrderItemModifierRow = {
  id: string
  order_item_id: string
  modifier_option_id: string
  price?: number | null
  price_delta?: number | null
}

type ModifierOptionRow = ModifierOption & {
  price?: number | null
}

const normalizePriceDelta = (
  row: OrderItemModifierRow,
  option?: ModifierOptionRow
) => row.price ?? row.price_delta ?? option?.price_delta ?? option?.price ?? 0

export const insertOrderItemModifiers = async (
  orderItemId: string,
  modifiers: SelectedModifier[]
): Promise<void> => {
  if (modifiers.length === 0) {
    return
  }

  const { error } = await supabase
    .from('order_item_modifiers')
    .insert(
      modifiers.map((modifier) => ({
        order_item_id: orderItemId,
        modifier_option_id: modifier.optionId,
        price: modifier.priceDelta,
      }))
    )

  if (error) {
    console.error('insertOrderItemModifiers error:', error)
    throw error
  }
}

export const deleteOrderItemModifiers = async (
  orderItemIds: string[]
): Promise<void> => {
  if (orderItemIds.length === 0) {
    return
  }

  const { error } = await supabase
    .from('order_item_modifiers')
    .delete()
    .in('order_item_id', orderItemIds)

  if (error) {
    console.error('deleteOrderItemModifiers error:', error)
    throw error
  }
}

export const getOrderItemModifiers = async (
  orderItemIds: string[]
): Promise<Record<string, SelectedModifier[]>> => {
  if (orderItemIds.length === 0) {
    return {}
  }

  const { data: modifierRows, error } = await supabase
    .from('order_item_modifiers')
    .select('*')
    .in('order_item_id', orderItemIds)

  if (error) {
    console.error('getOrderItemModifiers select error:', error)
    throw error
  }

  const rows = (modifierRows || []) as OrderItemModifierRow[]
  const optionIds = Array.from(
    new Set(rows.map((modifier) => modifier.modifier_option_id))
  )

  if (optionIds.length === 0) {
    return {}
  }

  const { data: optionsData, error: optionsError } = await supabase
    .from('modifier_options')
    .select('*')
    .in('id', optionIds)

  if (optionsError) {
    console.error('getOrderItemModifiers options select error:', optionsError)
    throw optionsError
  }

  const options = (optionsData || []) as ModifierOptionRow[]
  const optionsById = new Map(options.map((option) => [option.id, option]))
  const groupIds = Array.from(
    new Set(options.map((option) => option.modifier_group_id))
  )

  const { data: groupsData, error: groupsError } = await supabase
    .from('modifier_groups')
    .select('*')
    .in('id', groupIds)

  if (groupsError) {
    console.error('getOrderItemModifiers groups select error:', groupsError)
    throw groupsError
  }

  const groupsById = new Map(
    ((groupsData || []) as ModifierGroup[]).map((group) => [group.id, group])
  )

  return rows.reduce<Record<string, SelectedModifier[]>>((acc, row) => {
    const option = optionsById.get(row.modifier_option_id)

    if (!option) {
      return acc
    }

    const group = groupsById.get(option.modifier_group_id)
    const currentModifiers = acc[row.order_item_id] ?? []

    currentModifiers.push({
      groupId: option.modifier_group_id,
      groupName: group?.name ?? '',
      optionId: option.id,
      optionName: option.name,
      priceDelta: normalizePriceDelta(row, option),
    })
    acc[row.order_item_id] = currentModifiers

    return acc
  }, {})
}
