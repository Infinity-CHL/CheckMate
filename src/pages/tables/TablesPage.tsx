import { AppLoader } from '@/components/AppLoader'
import { useTables } from '@/features/tables/hooks/useTables'
import { TableGrid } from '@/features/tables/components/TableGrid'

export const TablesPage = () => {
  const { tables, loading, error } = useTables()

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
    <div className="container mx-auto p-4 pb-6 md:p-6">
      <TableGrid tables={tables} />
    </div>
  )
}
