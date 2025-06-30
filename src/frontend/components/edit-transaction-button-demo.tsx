import { EditTransactionDialog } from '@/components/edit-transaction-dialog'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

// Mock transaction data (replace with real data from API/table later)
const mockTransaction = {
  id: 1,
  type: 'EXPENSE',
  amount: 1999, // cents
  description: 'REWE Einkauf',
  categoryId: 2,
  currency: 'EUR',
  createdAt: '2025-06-28T13:31:04.647Z',
}

export default function EditTransactionButtonDemo() {
  return (
    <EditTransactionDialog transaction={mockTransaction}>
      <Button
        variant="ghost"
        size="icon"
        className="cursor-pointer"
        title="Bearbeiten"
      >
        <Pencil className="w-4 h-4" />
      </Button>
    </EditTransactionDialog>
  )
}
