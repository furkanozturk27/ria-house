'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar, Users, Key, Trash2, Loader2, Check, Smartphone, Monitor, Download, Lock, LogIn, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { supabase } from '@/lib/supabaseClient'
import { Event, ApplicationWithCode, Code } from '@/lib/types'
import { useToast, ToastContainer } from '@/components/ui/toast'
import CreateEventDialog from '@/components/admin/CreateEventDialog'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Turkish translations for admin dashboard
const adminTranslations = {
  // Header
  dashboardTitle: 'Yönetim Paneli',
  dashboardDescription: 'Etkinlikleri, başvuruları ve erişim kodlarını yönetin',
  
  // Stats
  totalApplications: 'Toplam Başvuru',
  approvedLabel: 'Onaylanan',
  capacity: 'Doluluk',
  
  // Events
  events: 'Etkinlikler',
  createEvent: 'Etkinlik Oluştur',
  manageEvent: 'Etkinliği Yönet',
  noEvents: 'Henüz etkinlik yok. İlk etkinliğinizi oluşturun!',
  deleteConfirm: 'Bu etkinliği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
  
  // Codes
  generateCodes: '🎟️ Kodları Oluştur',
  generating: 'Oluşturuluyor...',
  codesGenerated: 'kod oluşturuldu',
  totalCodes: 'toplam kod',
  availableCodes: 'müsait kod',
  downloadList: '📥 Listeyi İndir',
  downloading: 'İndiriliyor...',
  
  // Real-time notifications
  newApplication: 'Yeni Başvuru',
  
  // Applications
  applications: 'Başvurular',
  noApplications: 'Bu etkinlik için henüz başvuru yok',
  user: 'Kullanıcı',
  device: 'Cihaz',
  applicationTime: 'Başvuru Saati',
  status: 'Durum',
  code: 'Kod',
  action: 'İşlem',
  approve: 'ONAYLA',
  approving: 'İşleniyor...',
  
  // Status
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  
  // Success/Error messages
  eventCreated: 'Etkinlik başarıyla oluşturuldu!',
  eventDeleted: 'Etkinlik başarıyla silindi!',
  codesGeneratedSuccess: 'kod başarıyla oluşturuldu!',
  applicationApproved: 'Başvuru onaylandı! Kod otomatik olarak atandı.',
  errorLoadEvents: 'Etkinlikler yüklenemedi. Lütfen tekrar deneyin.',
  errorLoadData: 'Veriler yüklenemedi. Lütfen tekrar deneyin.',
  errorCreateEvent: 'Etkinlik oluşturulamadı. Lütfen tekrar deneyin.',
  errorDeleteEvent: 'Etkinlik silinemedi. Lütfen tekrar deneyin.',
  errorGenerateCodes: 'Kodlar oluşturulamadı. Lütfen tekrar deneyin.',
  errorApprove: 'Başvuru onaylanamadı. Lütfen tekrar deneyin.',
  errorNoApproved: 'İndirilecek onaylı başvuru bulunmuyor.',
  exportSuccess: 'onaylı başvuru CSV olarak indirildi.',
}

// Format date in Turkish locale: "D MMM, HH:mm"
const formatTurkishDate = (date: Date | string): string => {
  const d = new Date(date)
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  const day = d.getDate()
  const month = months[d.getMonth()]
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${day} ${month}, ${hours}:${minutes}`
}

// Parse device info from user agent
const parseDeviceInfo = (userAgent: string | null): { type: 'mobile' | 'desktop', label: string, icon: React.ReactNode } => {
  if (!userAgent) {
    return { type: 'desktop', label: 'Bilinmiyor', icon: <Monitor className="h-4 w-4" /> }
  }

  const ua = userAgent.toLowerCase()
  
  // Mobile detection
  if (/iphone|ipad|ipod|android|mobile|blackberry|opera|mini|windows\s+ce|palm|smartphone|iemobile/i.test(ua)) {
    if (/iphone|ipad|ipod/i.test(ua)) {
      return { type: 'mobile', label: 'iPhone/iPad', icon: <Smartphone className="h-4 w-4" /> }
    }
    if (/android/i.test(ua)) {
      return { type: 'mobile', label: 'Android', icon: <Smartphone className="h-4 w-4" /> }
    }
    return { type: 'mobile', label: 'Mobil', icon: <Smartphone className="h-4 w-4" /> }
  }
  
  // Desktop detection
  if (/windows/i.test(ua)) {
    if (/chrome/i.test(ua)) return { type: 'desktop', label: 'Windows Chrome', icon: <Monitor className="h-4 w-4" /> }
    if (/firefox/i.test(ua)) return { type: 'desktop', label: 'Windows Firefox', icon: <Monitor className="h-4 w-4" /> }
    if (/edge/i.test(ua)) return { type: 'desktop', label: 'Windows Edge', icon: <Monitor className="h-4 w-4" /> }
    return { type: 'desktop', label: 'Windows', icon: <Monitor className="h-4 w-4" /> }
  }
  if (/mac/i.test(ua)) {
    if (/chrome/i.test(ua)) return { type: 'desktop', label: 'Mac Chrome', icon: <Monitor className="h-4 w-4" /> }
    if (/safari/i.test(ua)) return { type: 'desktop', label: 'Mac Safari', icon: <Monitor className="h-4 w-4" /> }
    return { type: 'desktop', label: 'Mac', icon: <Monitor className="h-4 w-4" /> }
  }
  if (/linux/i.test(ua)) {
    return { type: 'desktop', label: 'Linux', icon: <Monitor className="h-4 w-4" /> }
  }
  
  return { type: 'desktop', label: 'Masaüstü', icon: <Monitor className="h-4 w-4" /> }
}

export default function AdminDashboard() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Existing dashboard state
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [applications, setApplications] = useState<ApplicationWithCode[]>([])
  const [codes, setCodes] = useState<Code[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editFile, setEditFile] = useState<File | null>(null)
  const { toasts, removeToast, success, error } = useToast()

  const t = adminTranslations

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('admin_token')
      if (token === 'true') {
        setIsAuthenticated(true)
      }
      setIsAuthLoading(false)
    }
  }, [])

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)

    // Hardcoded credentials check
    if (username === 'admin' && (password === '123' || password === 'velvet')) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_token', 'true')
      }
      setIsAuthenticated(true)
      success('Giriş başarılı!')
    } else {
      error('Kullanıcı adı veya şifre hatalı!')
    }

    setIsLoggingIn(false)
  }

  // Fetch all events
  const fetchEvents = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })

      if (fetchError) throw fetchError

      setEvents(data || [])
    } catch (err) {
      console.error('Error fetching events:', err)
      error(t.errorLoadEvents)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch applications and codes for selected event
  const fetchEventData = async (eventId: string) => {
    try {
      // Fetch applications
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (appsError) throw appsError

      // Fetch codes
      const { data: codesData, error: codesError } = await supabase
        .from('codes')
        .select('*')
        .eq('event_id', eventId)

      if (codesError) throw codesError

      // Join applications with assigned codes
      const applicationsWithCodes: ApplicationWithCode[] = (appsData || []).map((app) => {
        const assignedCode = (codesData || []).find(
          (code) => code.assigned_to_application_id === app.id
        )
        return {
          ...app,
          assigned_code: assignedCode?.code || null,
        }
      })

      setApplications(applicationsWithCodes)
      setCodes(codesData || [])
    } catch (err) {
      console.error('Error fetching event data:', err)
      error(t.errorLoadData)
    }
  }

  // Load events on mount
  useEffect(() => {
    fetchEvents()
  }, [])

  // Load event data when event is selected
  useEffect(() => {
    if (selectedEvent) {
      fetchEventData(selectedEvent.id)
    } else {
      setApplications([])
      setCodes([])
    }
  }, [selectedEvent])

  // Notification sound function
  const playNotificationSound = () => {
    try {
      // Premium "Bell" notification sound from Mixkit
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Ses çalma engellendi (Kullanıcı etkileşimi gerek):", e));
    } catch (e) {
      console.error("Ses hatası:", e);
    }
  };

  // Real-time subscription for applications
  useEffect(() => {
    if (!selectedEvent) return

    const channel = supabase
      .channel(`applications:${selectedEvent.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'applications',
          filter: `event_id=eq.${selectedEvent.id}`,
        },
        async (payload) => {
          // New application inserted
          const newApp = payload.new as ApplicationWithCode
          
          // Fetch the full application data including device_info
          const { data: fullApp } = await supabase
            .from('applications')
            .select('*')
            .eq('id', newApp.id)
            .single()

          if (fullApp) {
            // Check if code is already assigned (in case it was approved immediately)
            let assignedCode: string | null = null
            if (fullApp.status === 'approved') {
              const { data: codeData } = await supabase
                .from('codes')
                .select('code')
                .eq('assigned_to_application_id', fullApp.id)
                .single()
              assignedCode = codeData?.code || null
            }

            const appWithCode: ApplicationWithCode = {
              ...fullApp,
              assigned_code: assignedCode,
            }

            // Add to top of list (avoid duplicates)
            setApplications((prev) => {
              const exists = prev.find(a => a.id === appWithCode.id)
              if (exists) return prev
              return [appWithCode, ...prev]
            })
            
            // Show toast notification
            success(`${t.newApplication}: @${fullApp.instagram_handle}`)
            // Play notification sound
            playNotificationSound()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `event_id=eq.${selectedEvent.id}`,
        },
        async (payload) => {
          // Application updated (e.g., status changed)
          const updatedApp = payload.new as ApplicationWithCode
          
          // If status changed to approved, fetch the assigned code
          let assignedCode: string | null = null
          if (updatedApp.status === 'approved') {
            const { data: codeData } = await supabase
              .from('codes')
              .select('code')
              .eq('assigned_to_application_id', updatedApp.id)
              .single()

            assignedCode = codeData?.code || null
          }

          const appWithCode: ApplicationWithCode = {
            ...updatedApp,
            assigned_code: assignedCode,
          }

          // Update in local state
          setApplications((prev) =>
            prev.map((app) =>
              app.id === appWithCode.id
                ? appWithCode
                : app
            )
          )
        }
      )
      .subscribe()

    // Cleanup subscription on unmount or event change
    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedEvent, t.newApplication, success])

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`
    const { data, error } = await supabase.storage.from('posters').upload(fileName, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(fileName)
    return publicUrl
  }

  // Create new event
  const handleCreateEvent = async (eventData: {
    title: string
    date: string
    location: string
    description?: string
    imageFile?: File | null
  }) => {
    setIsCreatingEvent(true)
    setIsUploading(true)
    try {
      let imageUrl: string | null = null
      
      // Upload image if file is provided
      if (eventData.imageFile) {
        imageUrl = await uploadImage(eventData.imageFile)
      }
      
      const { data, error: createError } = await supabase
        .from('events')
        .insert([
          {
            title: eventData.title,
            date: eventData.date,
            location: eventData.location,
            description: eventData.description || null,
            image_url: imageUrl,
            is_active: true,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      success(t.eventCreated)
      await fetchEvents()
      setSelectedEvent(data)
    } catch (err: any) {
      console.error('Error creating event:', err)
      error(err.message || t.errorCreateEvent)
    } finally {
      setIsCreatingEvent(false)
      setIsUploading(false)
    }
  }

  // Update event
  const handleUpdateEvent = async () => {
    if (!editingEvent) return

    setIsUploading(true)
    try {
      let imageUrl = editingEvent.image_url || null

      // Upload new image if file is provided
      if (editFile) {
        const fileName = `${Date.now()}-${editFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`
        const { data, error: uploadError } = await supabase.storage.from('posters').upload(fileName, editFile)
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(fileName)
        imageUrl = publicUrl
      }

      // Update database
      const { data, error: updateError } = await supabase
        .from('events')
        .update({
          title: editingEvent.title,
          date: editingEvent.date,
          location: editingEvent.location,
          description: editingEvent.description || null,
          image_url: imageUrl,
        })
        .eq('id', editingEvent.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? data : e))
      
      // Update selected event if it's the one being edited
      if (selectedEvent?.id === editingEvent.id) {
        setSelectedEvent(data)
      }

      success('Etkinlik başarıyla güncellendi!')
      setIsEditModalOpen(false)
      setEditFile(null)
      setEditingEvent(null)
    } catch (err: any) {
      console.error('Error updating event:', err)
      error(err.message || 'Etkinlik güncellenemedi. Lütfen tekrar deneyin.')
    } finally {
      setIsUploading(false)
    }
  }

  // Delete event
  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(t.deleteConfirm)) {
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (deleteError) throw deleteError

      success(t.eventDeleted)
      await fetchEvents()
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null)
      }
    } catch (err: any) {
      console.error('Error deleting event:', err)
      error(err.message || t.errorDeleteEvent)
    }
  }

  // Generate codes for event
  const handleGenerateCodes = async (eventId: string) => {
    setIsGeneratingCodes(true)
    try {
      const { data, error: rpcError } = await supabase.rpc('generate_event_codes', {
        p_event_id: eventId,
        p_quantity: 100,
      })

      if (rpcError) throw rpcError

      success(`${data} ${t.codesGeneratedSuccess}`)
      await fetchEventData(eventId)
    } catch (err: any) {
      console.error('Error generating codes:', err)
      error(err.message || t.errorGenerateCodes)
    } finally {
      setIsGeneratingCodes(false)
    }
  }

  // Approve application
  const handleApproveApplication = async (applicationId: string) => {
    setIsApproving(true)
    setApprovingId(applicationId)
    try {
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'approved' })
        .eq('id', applicationId)

      if (updateError) throw updateError

      success(t.applicationApproved)
      // Refresh event data to show the assigned code
      if (selectedEvent) {
        await fetchEventData(selectedEvent.id)
      }
    } catch (err: any) {
      console.error('Error approving application:', err)
      error(err.message || t.errorApprove)
    } finally {
      setIsApproving(false)
      setApprovingId(null)
    }
  }

  // Calculate statistics
  const totalApplications = applications.length
  const approvedCount = applications.filter(a => a.status === 'approved').length
  const capacityPercentage = totalApplications > 0 ? Math.round((approvedCount / 100) * 100) : 0

  // CSV Export function
  const handleExportCSV = () => {
    if (!selectedEvent) return

    // Filter approved applications
    const approvedApps = applications.filter(a => a.status === 'approved')

    if (approvedApps.length === 0) {
      error(t.errorNoApproved)
      return
    }

    // Prepare CSV data
    const headers = ['Instagram Handle', 'Status', 'Assigned Code', 'Device Info', 'Date']
    const rows = approvedApps.map((app) => {
      const deviceInfo = parseDeviceInfo(app.device_info)
      return [
        `@${app.instagram_handle}`,
        app.status,
        app.assigned_code || '',
        deviceInfo.label,
        formatTurkishDate(app.created_at),
      ]
    })

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Create blob and trigger download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0]
    link.setAttribute('href', url)
    link.setAttribute('download', `guest-list-${dateStr}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    success(`${approvedApps.length} ${t.exportSuccess}`)
  }

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-200" />
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] relative overflow-hidden flex items-center justify-center p-4">
        <ToastContainer toasts={toasts} onClose={removeToast} />
        
        {/* Background Ambience */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full" />
        </div>

        {/* Login Form */}
        <div className="relative z-10 w-full max-w-md">
          <Card className="bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-amber-900/10">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Lock className="h-8 w-8 text-amber-200" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-600/50">
                VELVET ROOM
              </CardTitle>
              <p className="text-sm text-zinc-400 mt-2">Yönetim Paneli Girişi</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                    Kullanıcı Adı
                  </label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                    disabled={isLoggingIn}
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-700 focus:border-amber-500/50 focus:ring-amber-500/20"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                    Şifre
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoggingIn}
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-700 focus:border-amber-500/50 focus:ring-amber-500/20"
                    autoComplete="current-password"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-12 bg-amber-200 text-black hover:bg-white hover:scale-[1.01] transition-all rounded-xl font-bold tracking-wide text-sm shadow-[0_0_20px_rgba(253,230,138,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Giriş yapılıyor...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      GİRİŞ YAP
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show loading while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  // Render dashboard if authenticated
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white mb-2">{t.dashboardTitle}</h1>
            <p className="text-zinc-400 text-sm">{t.dashboardDescription}</p>
          </div>
          <Button
            onClick={playNotificationSound}
            variant="outline"
            className="mr-2 border-zinc-700 text-zinc-400 hover:text-white"
          >
            🔊 Test Ses
          </Button>
        </div>

        {/* Stats Cards - Only show when event is selected */}
        {selectedEvent && (
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">{t.totalApplications}</CardTitle>
                <Users className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalApplications}</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">{t.approvedLabel}</CardTitle>
                <Check className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{approvedCount}</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">{t.capacity}</CardTitle>
                <Key className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{capacityPercentage}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content - Wide Commander View */}
        <div className="space-y-8">
          {/* Left: Events List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">{t.events}</h2>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t.createEvent}
              </Button>
            </div>

            {events.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-zinc-400">
                    <p>{t.noEvents}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <Card
                    key={event.id}
                    className={`cursor-pointer transition-all ${
                      selectedEvent?.id === event.id
                        ? 'border-yellow-500/50 bg-yellow-500/10 ring-1 ring-yellow-500/30'
                        : 'border-zinc-800 bg-zinc-900/50 opacity-60 hover:opacity-100'
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className={`font-medium ${
                            selectedEvent?.id === event.id ? 'text-white' : 'text-zinc-300'
                          }`}>
                            {event.title}
                          </CardTitle>
                          <p className={`text-sm mt-1 ${
                            selectedEvent?.id === event.id ? 'text-zinc-300' : 'text-zinc-500'
                          }`}>
                            {event.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingEvent(event)
                              setEditFile(null)
                              setIsEditModalOpen(true)
                            }}
                            className="text-zinc-400 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteEvent(event.id, event.title)
                            }}
                            className="text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Selected Event Details - Wide Horizontal Bar */}
          {selectedEvent && (
            <div className="space-y-6">
              {/* Event Info Card - Wide Compact Horizontal */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      <CardTitle className="text-white text-xl mb-2">{selectedEvent.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                        <span>{selectedEvent.location}</span>
                        {selectedEvent.description && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="line-clamp-1">{selectedEvent.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingEvent(selectedEvent)
                          setEditFile(null)
                          setIsEditModalOpen(true)
                        }}
                        className="text-zinc-300 hover:text-white hover:bg-zinc-800"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                      <Button
                        onClick={() => handleGenerateCodes(selectedEvent.id)}
                        disabled={isGeneratingCodes}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                      >
                        {isGeneratingCodes ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t.generating}
                          </>
                        ) : (
                          <>
                            <Key className="h-4 w-4 mr-2" />
                            {t.generateCodes}
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={handleExportCSV}
                        disabled={approvedCount === 0}
                        variant="outline"
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t.downloadList}
                      </Button>
                    </div>
                  </div>
                  {codes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-xs text-zinc-400 text-center">
                        {codes.length} {t.totalCodes} • {codes.filter(c => !c.assigned_to_application_id).length} {t.availableCodes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Applications Table - Full Width */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">{t.applications}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {applications.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 px-6">
                      <p>{t.noApplications}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                            <TableHead className="text-zinc-300 font-medium py-4 px-6">{t.user}</TableHead>
                            <TableHead className="text-zinc-300 font-medium py-4 px-6">{t.device}</TableHead>
                            <TableHead className="text-zinc-300 font-medium py-4 px-6">{t.applicationTime}</TableHead>
                            <TableHead className="text-zinc-300 font-medium py-4 px-6">{t.status}</TableHead>
                            <TableHead className="text-zinc-300 font-medium py-4 px-6">{t.code}</TableHead>
                            <TableHead className="text-zinc-300 font-medium text-right py-4 px-6">{t.action}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {applications.map((app, index) => {
                            const deviceInfo = parseDeviceInfo(app.device_info)
                            return (
                              <TableRow 
                                key={app.id} 
                                className={`border-zinc-800 hover:bg-zinc-800/50 ${index % 2 === 0 ? 'bg-zinc-900/50' : 'bg-zinc-900/30'}`}
                              >
                                <TableCell className="font-semibold text-white py-4 px-6">
                                  <div title={`@${app.instagram_handle}`}>
                                    @{app.instagram_handle}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  <div className="flex items-center gap-2 text-zinc-300" title={deviceInfo.label}>
                                    {deviceInfo.icon}
                                    <span className="text-sm">{deviceInfo.label}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-zinc-400 text-sm py-4 px-6">
                                  {formatTurkishDate(app.created_at)}
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  <Badge
                                    variant={app.status === 'approved' ? 'default' : 'outline'}
                                    className={
                                      app.status === 'approved'
                                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                        : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                    }
                                  >
                                    {app.status === 'approved' ? t.approved : t.pending}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  {app.assigned_code ? (
                                    <span className="font-mono text-amber-400 font-semibold" title={app.assigned_code}>
                                      {app.assigned_code}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-500">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right py-4 px-6">
                                  {app.status === 'pending' && (
                                    <Button
                                      onClick={() => handleApproveApplication(app.id)}
                                      disabled={isApproving && approvingId === app.id}
                                      className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] text-xs uppercase font-bold tracking-wider"
                                      size="sm"
                                    >
                                      {isApproving && approvingId === app.id ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                          {t.approving}
                                        </>
                                      ) : (
                                        <>
                                          <Check className="h-4 w-4 mr-2" />
                                          {t.approve}
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* No Event Selected */}
          {!selectedEvent && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="text-center py-12 text-zinc-400">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2 text-zinc-300">Etkinlik Seçilmedi</p>
                  <p className="text-sm">Listeden bir etkinlik seçerek başvuruları ve kodları yönetin</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Event Dialog */}
      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateEvent}
        isUploading={isUploading}
      />

      {/* Edit Event Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Etkinliği Düzenle</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Etkinlik bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleUpdateEvent()
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label htmlFor="edit-title" className="text-sm font-medium text-zinc-400">
                  Etkinlik Başlığı *
                </label>
                <Input
                  id="edit-title"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  placeholder="Saturday Night Fever"
                  required
                  disabled={isUploading}
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-yellow-500 focus:border-yellow-500/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-date" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tarih & Saat *
                </label>
                <Input
                  id="edit-date"
                  type="datetime-local"
                  value={new Date(editingEvent.date).toISOString().slice(0, 16)}
                  onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  required
                  disabled={isUploading}
                  className="bg-zinc-900 border-zinc-800 text-white focus:ring-yellow-500 focus:border-yellow-500/50 [color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-location" className="text-sm font-medium text-zinc-400">
                  Konum *
                </label>
                <Input
                  id="edit-location"
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  placeholder="Rooftop Lounge, Downtown"
                  required
                  disabled={isUploading}
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-yellow-500 focus:border-yellow-500/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-description" className="text-sm font-medium text-zinc-400">
                  Açıklama (Opsiyonel)
                </label>
                <textarea
                  id="edit-description"
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  placeholder="An exclusive rooftop party featuring world-class DJs..."
                  className="w-full min-h-[80px] rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 focus-visible:border-yellow-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-image" className="text-sm font-medium text-zinc-400">
                  Yeni Afiş Yükle
                </label>
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  disabled={isUploading}
                  className="bg-black border-zinc-800 text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Yeni afiş seç (Mevcutu korumak için boş bırakın)
                </p>
                {editingEvent.image_url && (
                  <p className="text-xs text-zinc-400 mt-1">
                    Mevcut afiş: <a href={editingEvent.image_url} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">Görüntüle</a>
                  </p>
                )}
                {editFile && (
                  <p className="text-xs text-zinc-400 mt-1">
                    Seçilen dosya: {editFile.name}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingEvent(null)
                    setEditFile(null)
                  }}
                  disabled={isUploading}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading}
                  className="bg-yellow-500/90 hover:bg-yellow-500 text-[#050505] font-medium"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    'Kaydet'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
