import { Button } from '@/components/ui/button'
import { ORDER_STATUS, type OrderStatus } from '@/entities/order/constants/order.constants'

interface OrderFiltersProps {
  activeFilter: OrderStatus | 'all'
  onFilterChange: (filter: OrderStatus | 'all') => void
}

const filters: Array<{ value: 'all' | OrderStatus; label: string }> = [
  { value: ORDER_STATUS.OPEN, label: 'Активные' },
  { value: ORDER_STATUS.CLOSED, label: 'Закрытые' },
  { value: 'all', label: 'Все' },
]

export const OrderFilters = ({ activeFilter, onFilterChange }: OrderFiltersProps) => {
  return (
    <div className="mb-6 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? 'default' : 'outline'}
          onClick={() => onFilterChange(filter.value)}
          className="h-9"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )
}
