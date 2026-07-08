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
  group_id: string
  price?: number | null
}

const normalizePriceDelta = (
  row: OrderItemModifierRow,
  option?: ModifierOptionRow
) => row.price ?? row.price_delta ?? option?.price ?? option?.price_delta ?? 0

const getModifierOptionGroupId = (option: ModifierOptionRow) =>
  option.group_id ?? option.modifier_group_id

const getSelectedModifierOptionId = (modifier: SelectedModifier) =>
  modifier.optionId ?? modifier.modifier_option_id

const getSelectedModifierPrice = (modifier: SelectedModifier) =>
  modifier.priceDelta ?? modifier.price ?? 0

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
        modifier_option_id: getSelectedModifierOptionId(modifier),
        price: getSelectedModifierPrice(modifier),
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
    .select('id, group_id, name, price, sort_order, created_at')
    .in('id', optionIds)

  if (optionsError) {
    console.error('getOrderItemModifiers options select error:', optionsError)
    throw optionsError
  }

  const options = (optionsData || []) as ModifierOptionRow[]
  const optionsById = new Map(options.map((option) => [option.id, option]))
  const groupIds = Array.from(
    new Set(options.map((option) => getModifierOptionGroupId(option)))
  ).filter(Boolean)

  const { data: groupsData, error: groupsError } = await supabase
    .from('modifier_groups')
    .select('id, menu_item_id, name, is_required, max_select, sort_order, created_at')
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

    const groupId = getModifierOptionGroupId(option)
    const group = groupsById.get(groupId)
    const currentModifiers = acc[row.order_item_id] ?? []

    const priceDelta = normalizePriceDelta(row, option)

    currentModifiers.push({
      groupId,
      groupName: group?.name ?? '',
      optionId: option.id,
      optionName: option.name,
      priceDelta,
      group_id: groupId,
      group_name: group?.name ?? '',
      modifier_option_id: option.id,
      option_name: option.name,
      price: priceDelta,
    })
    acc[row.order_item_id] = currentModifiers

    return acc
  }, {})
}
