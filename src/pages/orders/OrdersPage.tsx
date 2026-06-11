import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { ORDER_STATUS, type OrderStatus } from '@/entities/order/constants/order.constants'
import { OrderFilters } from '@/features/orders/components/OrderFilters'
import { OrderList } from '@/features/orders/components/OrderList'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { Plus } from 'lucide-react'

type OrdersFilter = OrderStatus | 'all'

type OrdersScrollState = {
  scrollY: number
  status: OrdersFilter
  path: string
}

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

const readScrollState = (status: OrdersFilter): OrdersScrollState | null => {
  const rawState = sessionStorage.getItem(getScrollKey(status))

  if (!rawState) {
    return null
  }

  try {
    const state = JSON.parse(rawState) as Partial<OrdersScrollState>

    if (
      state.status !== status ||
      typeof state.scrollY !== 'number' ||
      Number.isNaN(state.scrollY)
    ) {
      return null
    }

    return {
      scrollY: state.scrollY,
      status,
      path: state.path ?? `/orders?status=${status}`,
    }
  } catch {
    return null
  }
}

export const OrdersPage = () => {
  const { orders, loading, error } = useOrders()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = getValidFilter(searchParams.get('status'))
  const skipNextRestoreRef = useRef(false)
  const restoredScrollRef = useRef<string | null>(null)

  const filteredOrders = useMemo(
    () =>
      filter === 'all'
        ? orders
        : orders.filter(order => order.status === filter),
    [filter, orders]
  )

  useEffect(() => {
    if (searchParams.get('status') !== filter) {
      setSearchParams({ status: filter }, { replace: true })
    }
  }, [filter, searchParams, setSearchParams])

  useLayoutEffect(() => {
    if (loading) {
      return
    }

    if (skipNextRestoreRef.current) {
      skipNextRestoreRef.current = false
      return
    }

    if (orders.length === 0) {
      return
    }

    const scrollState = readScrollState(filter)

    if (!scrollState) {
      return
    }

    const restoreKey = `${scrollState.status}:${scrollState.scrollY}:${scrollState.path}`

    if (restoredScrollRef.current === restoreKey) {
      return
    }

    window.scrollTo({ top: scrollState.scrollY, behavior: 'auto' })

    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = scrollState.scrollY
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollState.scrollY, behavior: 'auto' })

      if (document.scrollingElement) {
        document.scrollingElement.scrollTop = scrollState.scrollY
      }
      restoredScrollRef.current = restoreKey
    })

    return () => window.cancelAnimationFrame(animationFrameId)
  }, [filter, loading, orders.length])

  const handleFilterChange = (nextFilter: OrdersFilter) => {
    sessionStorage.removeItem(getScrollKey(nextFilter))
    skipNextRestoreRef.current = true
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
      <PageHeader
        title="Заказы"
        actions={
          <Button className="h-11 w-full sm:w-auto" onClick={() => navigate('/tables')}>
          <Plus className="mr-2 h-4 w-4" />
          Создать заказ
        </Button>
        }
      />

      <OrderFilters activeFilter={filter} onFilterChange={handleFilterChange} />
      <OrderList orders={filteredOrders} />
    </div>
  )
}
