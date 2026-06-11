import { TableCard } from './TableCard'
import type { RestaurantTable } from '@/entities/table/model/table.model'

interface TableGridProps {
  tables: RestaurantTable[]
}

export const TableGrid = ({ tables }: TableGridProps) => {
  if (tables.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Нет столов</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tables.map((table) => (
        <TableCard key={table.id} table={table} />
      ))}
    </div>
  )
}
