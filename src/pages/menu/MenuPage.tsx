import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MenuItem } from '@/entities/menu/model/menu-item.model'
import { getActiveMenuItems } from '@/features/menu/api/menuApi'

type MenuCategory = 'main' | 'bar' | 'kids'

const categories: Array<{ value: MenuCategory; label: string }> = [
  { value: 'main', label: 'Основное' },
  { value: 'bar', label: 'Бар' },
  { value: 'kids', label: 'Детское' },
]

const categoryLabels: Record<MenuCategory, string> = {
  main: 'Основное',
  bar: 'Бар',
  kids: 'Детское',
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price)

const isMenuCategory = (category: string | null | undefined): category is MenuCategory =>
  category === 'main' || category === 'bar' || category === 'kids'

export const MenuPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('main')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category === activeCategory),
    [activeCategory, menuItems]
  )

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true)
        setError(null)
        const items = await getActiveMenuItems()
        setMenuItems(items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки меню')
      } finally {
        setLoading(false)
      }
    }

    void fetchMenu()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Ошибка: {error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Меню</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Активные позиции меню по категориям.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6 sm:flex sm:flex-wrap">
        {categories.map((category) => (
          <Button
            key={category.value}
            className="h-11"
            variant={activeCategory === category.value ? 'default' : 'outline'}
            onClick={() => setActiveCategory(category.value)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            В этой категории пока нет позиций
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const category = isMenuCategory(item.category) ? item.category : activeCategory

            return (
              <Card key={item.id} className="min-h-32">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge variant="outline">{categoryLabels[category]}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">{formatPrice(item.price)}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
