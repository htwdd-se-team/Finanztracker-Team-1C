'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'

export function DataImportDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  // store files as an array so we can add/remove easily
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const queryClient = useQueryClient()

  async function handleUpload() {
    if (!files || files.length === 0) {
      toast.error('Bitte mindestens eine Datei auswählen')
      return
    }

    const fd = new FormData()
    files.forEach(f => fd.append('files', f))

    try {
      setIsUploading(true)

      // Get token from localStorage
      const token = localStorage.getItem('jwt')

      const res = await apiClient.instance.post('/entries/import', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      const data = res.data
      // If backend returns array of created entries, show count
      if (Array.isArray(data)) {
        toast.success(`${data.length} Einträge importiert`)
      } else {
        toast.success('Import erfolgreich')
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setFiles([])
      setOpen(false)
    } catch (err) {
      console.error(err)
      toast.error('Fehler beim Importieren der Dateien')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? <Button>Bankdaten importieren</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bankdaten importieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Wählen Sie CSV/TXT/XLSX Dateien aus, die Banktransaktionen enthalten. Sie
            können mehrere Dateien gleichzeitig hochladen. Neue Auswahlen werden
            zur bestehenden Liste hinzugefügt.
          </p>

          {/* hidden native input, triggered by the visible button */}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".csv,.txt,.xlsx,text/*"
            className="hidden"
            onChange={e => {
              const list = e.target.files
              if (!list) return

              const added = Array.from(list)

              // dedupe by name+size
              setFiles(prev => {
                const map = new Map(prev.map(f => [f.name + '::' + f.size, f]))
                for (const f of added) {
                  const key = f.name + '::' + f.size
                  if (!map.has(key)) map.set(key, f)
                }
                return Array.from(map.values())
              })

              // clear native input so the same file can be selected again if needed
              if (inputRef.current) inputRef.current.value = ''
            }}
          />

          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            Dateien hochladen
          </Button>

          {files && files.length > 0 && (
            <div className="flex flex-col space-y-2">
              {files.map((f, idx) => (
                <div
                  key={f.name + '::' + f.size}
                  className="flex items-center justify-between gap-2 p-2 rounded bg-muted/5"
                >
                  <div className="text-sm truncate">
                    <div className="font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(f.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setFiles(prev => prev.filter((_, i) => i !== idx))
                      }
                      aria-label={`Datei ${f.name} entfernen`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUploading}
          >
            Abbrechen
          </Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Hochladen...' : 'Importieren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DataImportDialog
