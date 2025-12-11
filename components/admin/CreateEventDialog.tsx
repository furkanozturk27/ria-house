'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, MapPin, FileText, Loader2 } from 'lucide-react'

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (event: { title: string; date: string; location: string; description?: string; imageFile?: File | null }) => Promise<void>
  isUploading?: boolean
}

export default function CreateEventDialog({ open, onOpenChange, onCreate, isUploading = false }: CreateEventDialogProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date || !location.trim()) return

    setIsSubmitting(true)
    try {
      await onCreate({ 
        title: title.trim(), 
        date, 
        location: location.trim(), 
        description: description.trim() || undefined,
        imageFile: selectedFile
      })
      // Reset form
      setTitle('')
      setDate('')
      setLocation('')
      setDescription('')
      setSelectedFile(null)
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">Yeni Etkinlik Oluştur</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Sisteme yeni bir etkinlik ekleyin
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-zinc-300">
              Etkinlik Başlığı *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Saturday Night Fever"
              required
              disabled={isSubmitting}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-yellow-500 focus:border-yellow-500/50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tarih & Saat *
            </label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={isSubmitting}
              className="bg-zinc-900 border-zinc-800 text-white focus:ring-yellow-500 focus:border-yellow-500/50 [color-scheme:dark]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Konum *
            </label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Rooftop Lounge, Downtown"
              required
              disabled={isSubmitting}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-yellow-500 focus:border-yellow-500/50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Açıklama (Opsiyonel)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="An exclusive rooftop party featuring world-class DJs..."
              className="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 ring-offset-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 focus-visible:border-yellow-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting || isUploading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="image" className="text-sm font-medium text-zinc-300">
              Afiş Görseli (Opsiyonel)
            </label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              disabled={isSubmitting || isUploading}
              className="bg-black border-zinc-800 text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
            {selectedFile && (
              <p className="text-xs text-zinc-400 mt-1">
                Seçilen dosya: {selectedFile.name}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading}
              className="bg-yellow-500/90 hover:bg-yellow-500 text-[#050505] font-medium"
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? 'Yükleniyor...' : 'Oluşturuluyor...'}
                </>
              ) : (
                'Etkinlik Oluştur'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
