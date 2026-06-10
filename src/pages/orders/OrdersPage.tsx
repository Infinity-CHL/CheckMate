import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ORDER_STATUS, type OrderStatus } from '@/entities/order/constants/order.constants'
import { OrderFilters } from '@/features/orders/components/OrderFilters'
import { OrderList } from '@/features/orders/components/OrderList'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { Plus } from 'lucide-react'

type OrdersFilter = OrderStatus | 'all'

const ORDERS_FILTERS: OrdersFilter[] = [
  ORDER_STATUS.OPEN,
  ORDER_STATUS.CLOSED,
  'all',
]

const getValidFilter = (status: string | null): OrdersFilter => {
  return ORDERS_FILTERS.includes(status as OrdersFilter)
    ? status as OrdersFilter
    : ORDER_STATUS.OPEN
}

const getScrollKey = (status: OrdersFilter) =>
  `checkmate:orders-scroll:${status}`

export const OrdersPage = () => {
  const { orders, loading, error } = useOrders()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = getValidFilter(searchParams.get('status'))
  const filterRef = useRef(filter)

  const filteredOrders = useMemo(
    () =>
      filter === 'all'
        ? orders
        : orders.filter(order => order.status === filter),
    [filter, orders]
  )

  useEffect(() => {
    filterRef.current = filter
  }, [filter])

  useEffect(() => {
    if (searchParams.get('status') !== filter) {
      setSearchParams({ status: filter }, { replace: true })
    }
  }, [filter, searchParams, setSearchParams])

  useEffect(() => {
    if (loading) {
      return
    }

    const scrollY = Number(sessionStorage.getItem(getScrollKey(filter)) ?? 0)

    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
    })
  }, [filter, filteredOrders.length, loading])

  useEffect(() => {
    return () => {
      sessionStorage.setItem(
        getScrollKey(filterRef.current),
        String(window.scrollY)
      )
    }
  }, [])

  const handleFilterChange = (nextFilter: OrdersFilter) => {
    sessionStorage.setItem(getScrollKey(filter), String(window.scrollY))
    setSearchParams({ status: nextFilter })
  }

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
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <Button className="h-11 w-full sm:w-auto" onClick={() => navigate('/tables')}>
          <Plus className="mr-2 h-4 w-4" />
          Создать заказ
        </Button>
      </div>

      <OrderFilters activeFilter={filter} onFilterChange={handleFilterChange} />
      <OrderList orders={filteredOrders} />
    </div>
  )
}
