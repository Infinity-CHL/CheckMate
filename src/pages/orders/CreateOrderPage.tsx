import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateOrder } from '@/features/orders/hooks/useCreateOrder'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'

export const CreateOrderPage = () => {
  const [tableNumber, setTableNumber] = useState<number>(1)
  const [comment, setComment] = useState('')
  const { createOrder, loading, error } = useCreateOrder()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (tableNumber < 1) {
      return
    }

    await createOrder({
      table_number: tableNumber,
      comment: comment || undefined
    })
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад к заказам
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Создание нового заказа</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tableNumber">Номер стола *</Label>
              <Input
                id="tableNumber"
                type="number"
                min={1}
                value={tableNumber}
                onChange={(e) => setTableNumber(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Комментарий</Label>
              <Textarea
                id="comment"
                placeholder="Особые пожелания..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Создание...' : 'Создать заказ'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/orders')}>
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
