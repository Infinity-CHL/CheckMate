import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { AppLoader } from '@/components/AppLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { MenuItem } from '@/entities/menu/model/menu-item.model'
import { getMenuItems } from '@/features/menu/api/menuApi'
import { capitalizeFirstLetter, cn } from '@/lib/utils'

type MenuCategory = 'main' | 'bar' | 'kids'

const MENU_SECTION_FALLBACK = 'Без раздела'

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

const formatVolume = (volume: number) =>
  `${new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(volume)} мл`

const isMenuCategory = (
  category: string | null | undefined
): category is MenuCategory =>
  category === 'main' || category === 'bar' || category === 'kids'

const getSectionName = (item: MenuItem) =>
  item.menu_section?.trim() || MENU_SECTION_FALLBACK

const sortMenuItems = (items: MenuItem[]) =>
  [...items].sort((firstItem, secondItem) => {
    const firstSortOrder = firstItem.sort_order ?? Number.MAX_SAFE_INTEGER
    const secondSortOrder = secondItem.sort_order ?? Number.MAX_SAFE_INTEGER

    if (firstSortOrder !== secondSortOrder) {
      return firstSortOrder - secondSortOrder
    }

    return firstItem.name.localeCompare(secondItem.name, 'ru')
  })

const groupBySection = (items: MenuItem[]) =>
  sortMenuItems(items).reduce<Array<{ section: string; items: MenuItem[] }>>(
    (sections, item) => {
      const sectionName = getSectionName(item)
      const section = sections.find(
        (currentSection) => currentSection.section === sectionName
      )

      if (section) {
        section.items.push(item)
        return sections
      }

      sections.push({ section: sectionName, items: [item] })
      return sections
    },
    []
  )

const MenuItemCard = ({
  item,
  showMeta = false,
}: {
  item: MenuItem
  showMeta?: boolean
}) => {
  const category = isMenuCategory(item.category) ? item.category : null

  return (
    <Card className="min-w-0 rounded-3xl border-white/70 bg-white/85 shadow-sm backdrop-blur">
      <CardContent className="p-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words text-sm font-semibold leading-snug">
              {capitalizeFirstLetter(item.name)}
            </h3>
            {item.description?.trim() && (
              <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                {item.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.volume_ml ? (
                <Badge variant="outline">{formatVolume(item.volume_ml)}</Badge>
              ) : null}
              {item.is_alcohol ? (
                <Badge variant="outline">Алкоголь</Badge>
              ) : null}
              {item.discount_allowed === false ? (
                <Badge variant="secondary">Без скидки</Badge>
              ) : null}
              {item.is_active === false ? (
                <Badge variant="destructive">Неактивно</Badge>
              ) : null}
              {showMeta && category ? (
                <Badge variant="outline">
                  {categoryLabels[category]} · {getSectionName(item)}
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 whitespace-nowrap text-sm font-bold tabular-nums">
            {formatPrice(item.price)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const MenuPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('main')
  const [search, setSearch] = useState('')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const normalizedSearch = search.trim().toLowerCase()
  const isSearchMode = normalizedSearch.length > 0

  const categoryItems = useMemo(
    () =>
      sortMenuItems(
        menuItems.filter((item) => item.category === activeCategory)
      ),
    [activeCategory, menuItems]
  )

  const searchItems = useMemo(
    () =>
      sortMenuItems(
        menuItems.filter((item) =>
          item.name.toLowerCase().includes(normalizedSearch)
        )
      ),
    [menuItems, normalizedSearch]
  )

  const sections = useMemo(() => groupBySection(categoryItems), [categoryItems])

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true)
        setError(null)
        const items = await getMenuItems()
        setMenuItems(items)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Ошибка загрузки меню'
        )
      } finally {
        setLoading(false)
      }
    }

    void fetchMenu()
  }, [])

  useEffect(() => {
    setOpenSections({})
  }, [activeCategory])

  const toggleSection = (section: string) => {
    setOpenSections((currentSections) => ({
      ...currentSections,
      [section]: !currentSections[section],
    }))
  }

  if (loading) {
    return <AppLoader />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Ошибка: {error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-3 pb-24 md:p-6">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/70 bg-white/70 p-1.5 shadow-sm backdrop-blur">
          {categories.map((category) => (
            <Button
              key={category.value}
              type="button"
              className="h-9 rounded-2xl"
              variant={activeCategory === category.value ? 'default' : 'ghost'}
              onClick={() => setActiveCategory(category.value)}
            >
              {category.label}
            </Button>
          ))}
        </div>

        <Input
          className="h-11 rounded-2xl bg-white/85"
          placeholder="Поиск по названию"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isSearchMode ? (
        <div className="mt-4 space-y-2">
          {searchItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 bg-white/70 px-4 py-10 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </div>
          ) : (
            searchItems.map((item) => (
              <MenuItemCard key={item.id} item={item} showMeta />
            ))
          )}
        </div>
      ) : sections.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-border/80 bg-white/70 px-4 py-10 text-center text-sm text-muted-foreground">
          В этой категории пока нет позиций
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {sections.map((section) => {
            const isOpen = Boolean(openSections[section.section])

            return (
              <Card
                key={section.section}
                className="overflow-hidden rounded-3xl border-white/70 bg-white/80 shadow-sm backdrop-blur"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  onClick={() => toggleSection(section.section)}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {section.section}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {section.items.length} поз.
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="space-y-2 border-t border-border/70 bg-background/40 p-2">
                    {section.items.map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
