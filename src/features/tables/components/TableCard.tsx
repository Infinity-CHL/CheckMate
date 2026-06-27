import { useNavigate } from 'react-router-dom'
import { UsersRound } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { TABLE_STATUS } from '@/entities/table/constants/table.constants'
import type { RestaurantTable } from '@/entities/table/model/table.model'
import { cn } from '@/lib/utils'

interface TableCardProps {
  table: RestaurantTable
}

export const TableCard = ({ table }: TableCardProps) => {
  const navigate = useNavigate()
  const isOccupied = table.status === TABLE_STATUS.OCCUPIED
  const seats = table.seats ?? 4

  const handleClick = () => {
    if (isOccupied && table.activeOrderId) {
      navigate(`/orders/${table.activeOrderId}`)
      return
    }

    if (!isOccupied) {
      navigate(`/tables/${table.id}/order`)
    }
  }

  return (
    <Card
      className={cn(
        'min-w-0 cursor-pointer rounded-3xl border p-0 shadow-sm transition-all active:translate-y-px',
        isOccupied
          ? 'border-red-200 bg-red-50 hover:bg-red-100'
          : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
      )}
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div
              className={cn(
                'text-[11px] font-semibold uppercase tracking-wide',
                isOccupied ? 'text-red-700' : 'text-emerald-700'
              )}
            >
              {isOccupied ? 'Занят' : 'Свободен'}
            </div>
            <div className="mt-1 text-4xl font-bold leading-none tabular-nums">
              {table.number}
            </div>
          </div>

          <div
            className={cn(
              'rounded-2xl px-2 py-1 text-xs font-semibold tabular-nums',
              isOccupied
                ? 'bg-red-100 text-red-700'
                : 'bg-emerald-100 text-emerald-700'
            )}
          >
            №{table.number}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <UsersRound className="h-3.5 w-3.5" />
          <span>{seats} мест</span>
        </div>
      </CardContent>
    </Card>
  )
}
