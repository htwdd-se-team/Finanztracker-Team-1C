import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface AddCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCategoryDialog({
  open,
  onOpenChange,
}: AddCategoryDialogProps) {
  const [name, setName] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) return

    // TODO: Hook up API call
    console.log('Creating category:', {
      name,
      color: 'blue', // placeholder
      icon: 'wallet', // placeholder
    })

    setName('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Kategorie erstellen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              placeholder="z. B. Lebensmittel"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Farbe</Label>
            <div className="border rounded p-2 text-sm text-muted-foreground">
              [Color Picker Placeholder]
            </div>
          </div>
          <div>
            <Label>Icon</Label>
            <div className="border rounded p-2 text-sm text-muted-foreground">
              [Icon Picker Placeholder]
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
