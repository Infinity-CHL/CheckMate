export interface ModifierOption {
  id: string
  modifier_group_id: string
  name: string
  price_delta: number
  is_active?: boolean | null
  created_at?: string
  updated_at?: string
}

export interface ModifierGroup {
  id: string
  menu_item_id: string
  name: string
  min_select?: number | null
  min_selected?: number | null
  max_select?: number | null
  max_selected?: number | null
  is_required?: boolean | null
  sort_order?: number | null
  modifier_options?: ModifierOption[]
  created_at?: string
  updated_at?: string
}

export interface SelectedModifier {
  groupId: string
  groupName: string
  optionId: string
  optionName: string
  priceDelta: number
}

export interface MenuItem {
  id: string
  name: string
  price: number
  category?: string | null
  menu_section?: string | null
  item_type?: string | null
  description?: string | null
  volume_ml?: number | null
  is_alcohol?: boolean | null
  is_active?: boolean | null
  discount_allowed?: boolean | null
  sort_order?: number | null
  modifier_groups?: ModifierGroup[]
  created_at?: string
  updated_at?: string
}
