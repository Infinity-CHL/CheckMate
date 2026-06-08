// Фильтры (по статусу, дате)
import { Button } from '@/components/ui/button'
import { ORDER_STATUS, ORDER_STATUS_LABELS, type OrderStatus } from '@/entities/order/constants/order.constants'

interface OrderFiltersProps {
  activeFilter: OrderStatus | 'all'
  onFilterChange: (filter: OrderStatus | 'all') => void
}

const filters: Array<{ value: 'all' | OrderStatus; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: ORDER_STATUS.ACTIVE, label: ORDER_STATUS_LABELS[ORDER_STATUS.ACTIVE] },
  { value: ORDER_STATUS.PREPARING, label: ORDER_STATUS_LABELS[ORDER_STATUS.PREPARING] },
  { value: ORDER_STATUS.READY, label: ORDER_STATUS_LABELS[ORDER_STATUS.READY] },
]

export const OrderFilters = ({ activeFilter, onFilterChange }: OrderFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? 'default' : 'outline'}
          onClick={() => onFilterChange(filter.value)}
          className="capitalize"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )
}
