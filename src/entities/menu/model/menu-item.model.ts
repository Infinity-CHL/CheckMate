export interface MenuItem {
  id: string
  name: string
  price: number
  category?: string | null
  is_active?: boolean | null
  created_at?: string
  updated_at?: string
}
