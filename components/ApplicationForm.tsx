'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Instagram } from 'lucide-react'

interface ApplicationFormProps {
  onSubmit: (handle: string) => void
  eventId: string
}

export default function ApplicationForm({ onSubmit, eventId }: ApplicationFormProps) {
  const [handle, setHandle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!handle.trim()) return

    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    onSubmit(handle.trim())
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="instagram" className="text-sm font-medium text-foreground">
          Instagram Handle
        </label>
        <div className="relative">
          <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="instagram"
            type="text"
            placeholder="@yourhandle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="pl-10"
            required
            disabled={isSubmitting}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Enter your Instagram handle to apply for event access
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Application'}
      </Button>
    </form>
  )
}

