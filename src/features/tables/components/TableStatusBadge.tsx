import { Badge } from '@/components/ui/badge'
import {
  TABLE_STATUS_COLORS,
  TABLE_STATUS_LABELS,
  type TableStatus,
} from '@/entities/table/constants/table.constants'

interface TableStatusBadgeProps {
  status: TableStatus
}

export const TableStatusBadge = ({ status }: TableStatusBadgeProps) => {
  return (
    <Badge className={`${TABLE_STATUS_COLORS[status]} text-white`}>
      {TABLE_STATUS_LABELS[status]}
    </Badge>
  )
}
