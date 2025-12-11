'use client'

import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { QRCodeSVG } from 'react-qr-code'
import { Application, Event } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ApplicationStatusProps {
  application: Application
  event: Event | null
}

export default function ApplicationStatus({ application, event }: ApplicationStatusProps) {
  const getStatusIcon = () => {
    switch (application.status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-[#D4AF37]" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusMessage = () => {
    switch (application.status) {
      case 'approved':
        return 'Your application has been approved!'
      case 'pending':
        return 'Your application is under review'
      case 'rejected':
        return 'Your application was not approved'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div>
          <p className="font-semibold text-foreground">{getStatusMessage()}</p>
          <p className="text-sm text-muted-foreground">
            Handle: {application.instagram_handle}
          </p>
        </div>
      </div>

      {application.status === 'pending' && (
        <div className="p-4 bg-[#1A1A1A] border border-[#383838] rounded-lg">
          <p className="text-sm text-muted-foreground">
            We're reviewing your application. You'll be notified once a decision has been made.
          </p>
        </div>
      )}

      {application.status === 'approved' && application.assigned_code && (
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#D4AF37]/20 rounded-lg">
            <div className="text-center space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Your Access Code</p>
                <p className="text-4xl font-bold text-gold-gradient tracking-wider">
                  {application.assigned_code}
                </p>
              </div>
              
              <div className="flex justify-center pt-4">
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG
                    value={application.assigned_code}
                    size={200}
                    level="H"
                    fgColor="#050505"
                    bgColor="#FFFFFF"
                  />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground pt-2">
                Present this code or QR code at the event entrance
              </p>
            </div>
          </div>
        </div>
      )}

      {application.status === 'rejected' && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">
            Unfortunately, your application was not approved for this event.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Badge variant={application.status === 'approved' ? 'default' : application.status === 'pending' ? 'outline' : 'destructive'}>
          {application.status.toUpperCase()}
        </Badge>
      </div>
    </div>
  )
}

