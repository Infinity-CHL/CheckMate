import { PageHeader } from '@/components/PageHeader'
import { useTables } from '@/features/tables/hooks/useTables'
import { TableGrid } from '@/features/tables/components/TableGrid'

export const TablesPage = () => {
  const { tables, loading, error } = useTables()

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
      <PageHeader title="Столы" />

      <TableGrid tables={tables} />
    </div>
  )
}
