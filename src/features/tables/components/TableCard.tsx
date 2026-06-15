import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TABLE_CARD_COLORS, TABLE_STATUS } from '@/entities/table/constants/table.constants'
import type { RestaurantTable } from '@/entities/table/model/table.model'
import { cn } from '@/lib/utils'
import { TableStatusBadge } from './TableStatusBadge'

interface TableCardProps {
  table: RestaurantTable
}

export const TableCard = ({ table }: TableCardProps) => {
  const navigate = useNavigate()
  const isClickable = table.status === TABLE_STATUS.FREE
  const seats = table.seats ?? 4

  const handleClick = () => {
    if (!isClickable) return

    navigate(`/tables/${table.id}/order`)
  }

  return (
    <Card
      className={cn(
        'min-h-32 border-white/70 p-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        TABLE_CARD_COLORS[table.status],
        isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="text-lg">Стол №{table.number}</CardTitle>
        <TableStatusBadge status={table.status} />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Мест: {seats}
        </p>
      </CardContent>
    </Card>
  )
}
