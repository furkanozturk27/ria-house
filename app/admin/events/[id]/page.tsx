'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Key, Users, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockEvents, getApplicationsForEvent, getCodesForEvent, getUnusedCodesForEvent } from '@/lib/mockData'
import { formatEventDate, generateCode } from '@/lib/utils'
import { Application } from '@/lib/types'
import Link from 'next/link'

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string
  const event = mockEvents.find(e => e.id === eventId)
  
  const [applications, setApplications] = useState<Application[]>([])
  const [codes, setCodes] = useState(getCodesForEvent(eventId))
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (eventId) {
      setApplications(getApplicationsForEvent(eventId))
      setCodes(getCodesForEvent(eventId))
    }
  }, [eventId])

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Event not found</p>
            <Link href="/admin">
              <Button variant="outline" className="mt-4 w-full">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleGenerateCodes = async () => {
    setIsGenerating(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate 100 codes
    const newCodes = Array.from({ length: 100 }, () => ({
      id: `c${Date.now()}-${Math.random()}`,
      event_id: event.id,
      code: generateCode(),
      is_used: false,
      assigned_to_application_id: null,
      created_at: new Date().toISOString(),
    }))
    
    setCodes([...codes, ...newCodes])
    setIsGenerating(false)
  }

  const handleApprove = (applicationId: string) => {
    const unusedCodes = getUnusedCodesForEvent(event.id)
    if (unusedCodes.length === 0) {
      alert('No unused codes available. Please generate more codes.')
      return
    }

    // Assign first unused code
    const codeToAssign = unusedCodes[0]
    
    // Update application
    setApplications(applications.map(app => 
      app.id === applicationId
        ? { ...app, status: 'approved' as const, assigned_code: codeToAssign.code, approved_at: new Date() }
        : app
    ))

    // Mark code as used
    setCodes(codes.map(code =>
      code.id === codeToAssign.id
        ? { ...code, is_used: true, assigned_to_application_id: applicationId }
        : code
    ))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-[#D4AF37]" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const unusedCodesCount = codes.filter(c => !c.is_used).length

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin">
          <Button variant="ghost" className="mb-4">
            ← Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-4xl font-bold luxury-heading text-gold-gradient mb-2">
          {event.title}
        </h1>
        <p className="text-muted-foreground">{event.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{formatEventDate(new Date(event.event_date))}</span>
          <span>•</span>
          <span>{event.location}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Access Codes
            </CardTitle>
            <CardDescription>
              {codes.length} total codes, {unusedCodesCount} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateCodes}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate 100 Codes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Applications
            </CardTitle>
            <CardDescription>
              {applications.length} total applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending:</span>
                <span className="font-semibold">
                  {applications.filter(a => a.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approved:</span>
                <span className="font-semibold text-[#D4AF37]">
                  {applications.filter(a => a.status === 'approved').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Review and approve applications for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instagram Handle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Code</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No applications yet
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      {app.instagram_handle}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(app.status)}
                        <Badge
                          variant={
                            app.status === 'approved'
                              ? 'default'
                              : app.status === 'pending'
                              ? 'outline'
                              : 'destructive'
                          }
                        >
                          {app.status.toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {app.assigned_code ? (
                        <span className="font-mono text-[#D4AF37]">
                          {app.assigned_code}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {app.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(app.id)}
                          disabled={unusedCodesCount === 0}
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

