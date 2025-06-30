import { TransactionDialog } from '@/components/TransactionDialog'
import { Button } from '@/components/ui/button'
import { Plus, Pencil } from 'lucide-react'
import {
  ApiCurrency,
  ApiTransactionType,
  ApiEntryResponseDto,
} from '@/__generated__/api'

const mockTransaction: ApiEntryResponseDto = {
  id: 1,
  type: ApiTransactionType.EXPENSE,
  amount: 2599,
  description: 'Testausgabe – Mocked',
  categoryId: 1,
  currency: ApiCurrency.EUR,
  createdAt: '2024-05-10T00:00:00Z',
}

export default function EditTransactionDemo() {
  return (
    <div className="p-10">
      <h1 className="text-xl font-bold mb-4">Test Dialog mit Mock-Daten</h1>
      <TransactionDialog editData={mockTransaction}>
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          title="Bearbeiten"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </TransactionDialog>

      <div className="mt-6" />
      <TransactionDialog>
        <Button className="justify-start w-full" variant="ghost" size="sm">
          <Plus className="mr-2 w-4 h-4" />
          Neue Transaktion
        </Button>
      </TransactionDialog>
    </div>
  )
}
