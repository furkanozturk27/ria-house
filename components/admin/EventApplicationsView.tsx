'use client'

import { CheckCircle2, Clock, XCircle, Key } from 'lucide-react'
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
import { ApplicationWithCode } from '@/lib/types'

interface EventApplicationsViewProps {
  applications: ApplicationWithCode[]
  onApprove: (applicationId: string) => Promise<void>
  isApproving: boolean
}

export default function EventApplicationsView({
  applications,
  onApprove,
  isApproving,
}: EventApplicationsViewProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-[#D4AF37]" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const pendingCount = applications.filter(a => a.status === 'pending').length
  const approvedCount = applications.filter(a => a.status === 'approved').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Applications
            </CardTitle>
            <CardDescription>
              {applications.length} total • {pendingCount} pending • {approvedCount} approved
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No applications yet for this event</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instagram Handle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Code</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
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
                      <span className="font-mono text-[#D4AF37] font-semibold">
                        {app.assigned_code}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {app.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => onApprove(app.id)}
                        disabled={isApproving}
                      >
                        {isApproving ? 'Approving...' : 'Approve'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

