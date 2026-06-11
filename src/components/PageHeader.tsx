import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

type PageHeaderProps = {
  title: string
  backTo?: string
  actions?: ReactNode
}

export const PageHeader = ({
  title,
  backTo,
  actions,
}: PageHeaderProps) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backTo) {
      navigate(backTo)
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-h-11 items-center gap-3">
        {backTo && (
          <Button
            type="button"
            variant="ghost"
            className="h-10 px-2 text-sm font-medium"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Назад
          </Button>
        )}
        <div className="text-sm font-medium">{title}</div>
      </div>

      {actions && <div className="w-full sm:w-auto">{actions}</div>}
    </div>
  )
}
