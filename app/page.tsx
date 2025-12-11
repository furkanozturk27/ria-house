'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Calendar, MapPin, Sparkles, Lock, Check, Loader2, Ticket, XCircle, RefreshCw, Smartphone, QrCode as QrIcon, ShieldAlert, LogOut } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabaseClient'
import { Event, Application, ApplicationWithCode } from '@/lib/types'
import QRCode from 'react-qr-code'
import { useToast, ToastContainer } from '@/components/ui/toast'

// --- REBRANDING: CONSTANTS ---
const CLUB_NAME = 'RIA HOUSE' // Marka adı güncellendi

const translations = {
  tr: {
    heroTitle: 'ÖZEL ETKİNLİK',
    heroSubtitle: 'AYRICALIKLI ERİŞİM',
    heroDescription: 'Sıradan olanı kapıda bırak. Şehrin en özel gecesine adım at.',
    applyNow: 'BAŞVUR',
    upcomingEvents: 'YAKLAŞAN ETKİNLİKLER',
    noEvents: 'Şu anda aktif etkinlik bulunmuyor',
    comingSoon: 'Yakında',
    activeNow: 'Aktif',
    date: 'Tarih',
    location: 'Konum',
    applyForAccess: 'Katılım İçin Başvur',
    myApplication: 'DAVETİYEMİ GÖR',
    checkStatus: 'DURUMU SORGULA',
    alreadyApplied: 'Zaten başvurdun mu? Durumunu sorgula.',
    newApplication: '← Yeni Başvuru Yap',
    checkAnother: 'Farklı bir başvuru sorgula',
    instagramHandle: 'Instagram Kullanıcı Adı',
    instagramPlaceholder: '@kullaniciadi',
    instagramHint: 'Etkinlik erişimi için Instagram kullanıcı adınızı girin',
    submitApplication: 'BAŞVURU YAP',
    checking: 'Erişiminiz kontrol ediliyor...',
    applicationReceived: 'Başvurunuz alındı! Talebinizi inceliyoruz.',
    applicationApproved: 'Başvurunuz onaylandı!',
    applicationPending: 'Başvurunuz alındı! Talebinizi inceliyoruz.',
    applicationRejected: 'Başvurunuz onaylanmadı',
    reviewing: 'Başvurunuzu inceliyoruz. Karar verildiğinde bilgilendirileceksiniz.',
    accessGranted: 'ERİŞİM ONAYLANDI',
    yourAccessCode: 'Erişim Kodunuz',
    scanAtEntrance: 'Girişte taratın',
    screenshotHint: 'Giriş için bu kartın ekran görüntüsünü alınız',
    notApproved: 'Maalesef bu etkinlik için başvurunuz onaylanmadı.',
    errorLoadEvents: 'Etkinlikler yüklenemedi. Lütfen sayfayı yenileyin.',
    errorSomethingWrong: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    errorEmptyInput: 'Lütfen geçerli bir kullanıcı adı girin.',
    errorDeviceMismatch: 'Güvenlik Uyarısı: Bu başvuru başka bir cihazdan yapılmış. QR kodu görüntülenemez.',
    statusPending: 'BEKLİYOR',
    statusApproved: 'ONAYLANDI',
    statusRejected: 'REDDEDİLDİ',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' },
  },
  en: {
    heroTitle: 'EXCLUSIVE EVENT',
    heroSubtitle: 'EXCLUSIVE ACCESS',
    heroDescription: 'Leave the ordinary at the door. Step into the city\'s most exclusive night.',
    applyNow: 'APPLY NOW',
    upcomingEvents: 'UPCOMING EVENTS',
    noEvents: 'No active events at this time',
    comingSoon: 'Coming Soon',
    activeNow: 'Active',
    date: 'Date',
    location: 'Location',
    applyForAccess: 'Apply to Join',
    myApplication: 'VIEW MY INVITE',
    checkStatus: 'CHECK STATUS',
    alreadyApplied: 'Already applied? Check your status.',
    newApplication: '← Make New Application',
    checkAnother: 'Check another application',
    instagramHandle: 'Instagram Handle',
    instagramPlaceholder: '@yourhandle',
    instagramHint: 'Enter your Instagram handle to apply for event access',
    submitApplication: 'SUBMIT APPLICATION',
    checking: 'Checking access...',
    applicationReceived: 'Application received! We are reviewing your request.',
    applicationApproved: 'Your application has been approved!',
    applicationPending: 'Application received! We are reviewing your request.',
    applicationRejected: 'Your application was not approved',
    reviewing: "We're reviewing your application. You'll be notified once a decision has been made.",
    accessGranted: 'ACCESS GRANTED',
    yourAccessCode: 'Your Access Code',
    scanAtEntrance: 'Scan at entrance',
    screenshotHint: 'Please screenshot this pass for entry',
    notApproved: 'Unfortunately, your application was not approved for this event.',
    errorLoadEvents: 'Failed to load events. Please refresh the page.',
    errorSomethingWrong: 'Something went wrong. Please try again.',
    errorEmptyInput: 'Please enter a valid handle.',
    errorDeviceMismatch: 'Security Alert: This application was made from another device. Access denied.',
    statusPending: 'PENDING',
    statusApproved: 'APPROVED',
    statusRejected: 'REJECTED',
    dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' },
  },
} as const

type Language = 'tr' | 'en'

const formatEventDate = (date: Date, locale: Language): string => {
  // @ts-ignore
  const formatOptions = translations[locale].dateFormat as Intl.DateTimeFormatOptions
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', formatOptions).format(date)
}

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('tr')
  const [events, setEvents] = useState<Event[]>([])
  const [nextEvent, setNextEvent] = useState<Event | null>(null)
  const [futureEvents, setFutureEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [application, setApplication] = useState<ApplicationWithCode | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [savedHandle, setSavedHandle] = useState<string | null>(null)
  const [checkStatusMode, setCheckStatusMode] = useState(false)
  const [deviceSecret, setDeviceSecret] = useState<string | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const { toasts, removeToast, success, error } = useToast()
  const t = translations[language]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('club_guest_handle')
      if (saved) setSavedHandle(saved)

      let secret = localStorage.getItem('club_device_secret')
      if (!secret) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          secret = crypto.randomUUID()
        } else {
          secret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        }
        localStorage.setItem('club_device_secret', secret)
      }
      setDeviceSecret(secret)
    }
  }, [])

  const saveHandleToStorage = (handle: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('club_guest_handle', handle)
      setSavedHandle(handle)
    }
  }

  const handleClearSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('club_guest_handle')
    }
    setSavedHandle(null)
    setApplication(null)
    setCheckStatusMode(true) 
    setTimeout(() => {
        if(inputRef.current) inputRef.current.focus()
    }, 100)
  }

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('is_active', true)
          .order('date', { ascending: true })

        if (fetchError) throw fetchError

        const now = new Date()
        const activeEvents = (data || []).filter(event => new Date(event.date) >= now)

        setEvents(activeEvents)

        if (activeEvents.length > 0) {
          setNextEvent(activeEvents[0])
          setFutureEvents(activeEvents.slice(1))
        } else {
          setNextEvent(null)
          setFutureEvents([])
        }
      } catch (err) {
        console.error('Error fetching events:', err)
        error(t.errorLoadEvents)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [t.errorLoadEvents, error])

  const normalizeHandle = (handle: string): string => {
    return handle.replace(/^@/, '').toLowerCase().trim()
  }

  const handleEventClick = async (event: Event) => {
    setSelectedEvent(event)
    setIsDialogOpen(true)
    
    if (savedHandle) {
      setApplication(null) 
      setCheckStatusMode(true)
      setIsChecking(true) 
      await handleCheckApplication(savedHandle, event)
    } else {
      setApplication(null)
      setCheckStatusMode(false)
      setIsChecking(false)
    }
  }

  const handleCheckApplication = async (handle: string, currentEvent: Event | null = selectedEvent) => {
    if (!currentEvent) return

    const activeSecret = deviceSecret || (typeof window !== 'undefined' ? localStorage.getItem('club_device_secret') : null)
    if (!activeSecret) {
      error('Cihaz kimliği hatası. Sayfayı yenileyin.')
      setIsChecking(false)
      return
    }

    setIsChecking(true)
    const normalizedHandle = normalizeHandle(handle)

    try {
      const { data: existingApps, error: checkError } = await supabase
        .from('applications')
        .select('*')
        .eq('event_id', currentEvent.id)
        .eq('instagram_handle', normalizedHandle)
      
      if (checkError) throw checkError

      if (existingApps && existingApps.length > 0) {
        const existingApp = existingApps[0]

        // @ts-ignore
        if (existingApp.client_secret && existingApp.client_secret !== activeSecret) {
            console.warn('Security Alert: Device Mismatch')
            setApplication(null)
            error(t.errorDeviceMismatch)
            setIsChecking(false)
            return
        }

        let assignedCode: string | null = null
        if (existingApp.status === 'approved') {
          const { data: codeData } = await supabase
            .from('codes')
            .select('code')
            .eq('assigned_to_application_id', existingApp.id)
            .single()
          if (codeData) assignedCode = codeData.code
        }

        setApplication({ ...existingApp, assigned_code: assignedCode })
        saveHandleToStorage(normalizedHandle)
      } else {
        const deviceInfo = typeof window !== 'undefined' ? navigator.userAgent : 'unknown'
        
        const { data: newApp, error: createError } = await supabase
          .from('applications')
          .insert([
            {
              event_id: currentEvent.id,
              instagram_handle: normalizedHandle,
              status: 'pending',
              device_info: deviceInfo,
              client_secret: activeSecret 
            },
          ])
          .select()
          .single()

        if (createError) throw createError

        setApplication({ ...newApp, assigned_code: null })
        saveHandleToStorage(normalizedHandle)
        success(t.applicationReceived)
      }
    } catch (err: any) {
      console.error('Check App Error:', err)
      if (err.message?.includes('violates row-level security')) {
        error('Erişim reddedildi.')
      } else if (err.code === '23505') { 
        error('Bu kullanıcı adı ile zaten bir başvuru var.')
      } else {
        error(`${t.errorSomethingWrong}`)
      }
    } finally {
      setIsChecking(false)
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const handle = formData.get('handle') as string

    if (!handle || !handle.trim()) {
      error(t.errorEmptyInput)
      inputRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    await handleCheckApplication(handle)
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-300" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] relative overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Language Switcher */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setLanguage(lang => lang === 'tr' ? 'en' : 'tr')}
          className="text-xs uppercase tracking-[0.2em] text-white/40 hover:text-amber-200 transition-colors duration-300 font-medium"
        >
          <span className={language === 'tr' ? 'text-amber-200' : ''}>TR</span>
          <span className="mx-2 text-white/20">/</span>
          <span className={language === 'en' ? 'text-amber-200' : ''}>EN</span>
        </button>
      </div>

      {/* Hero Section - COMPACT & BRANDED */}
      <div className="relative z-10 border-b border-white/5 bg-gradient-to-b from-transparent to-black/40">
        <div className="container mx-auto px-4 py-12 sm:py-16"> {/* FIX: Padding azaltıldı (py-32 -> py-12) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center"
          >
            {/* LOGO & BRAND NAME WRAPPER */}
            <div className="mb-6 flex flex-col items-center justify-center">
              {/* Logo Image - Slightly smaller */}
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-4">
                <Image 
                  src="/logo.png" 
                  alt="Ria House Logo" 
                  fill
                  className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  priority
                />
              </div>
              
              {/* NEW: BRAND NAME TEXT */}
              <h1 className="text-3xl sm:text-5xl font-black tracking-[0.3em] text-white uppercase drop-shadow-lg">
                RIA HOUSE
              </h1>
            </div>

            <div className="flex items-center justify-center gap-4 mb-4 opacity-60">
                <div className="h-px w-8 sm:w-12 bg-amber-200/50" />
                <span className="text-[10px] sm:text-xs tracking-[0.3em] text-amber-100 font-light whitespace-nowrap">
                  {t.heroSubtitle}
                </span>
                <div className="h-px w-8 sm:w-12 bg-amber-200/50" />
            </div>
            
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed font-light">
              {t.heroDescription}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        
        {/* Next Event */}
        {nextEvent && (
          <div className="max-w-5xl mx-auto mb-24">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <Sparkles className="h-5 w-5 text-amber-200 animate-pulse" />
              <h2 className="text-sm font-medium tracking-[0.2em] text-amber-200/80">
                {t.applyNow}
              </h2>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <EventCard
                event={nextEvent}
                isActive={true}
                isNextEvent={true}
                onClick={() => handleEventClick(nextEvent)}
                language={language}
                t={t}
                savedHandle={savedHandle}
              />
            </motion.div>
          </div>
        )}

        {/* Future Events */}
        {futureEvents.length > 0 && (
          <div className="mb-16">
             <div className="flex items-center gap-4 mb-8 opacity-30">
                <div className="h-px flex-1 bg-white" />
                <h2 className="text-xs tracking-widest text-white whitespace-nowrap">{t.upcomingEvents}</h2>
                <div className="h-px flex-1 bg-white" />
             </div>
             
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {futureEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isActive={false}
                  isNextEvent={false}
                  onClick={() => {}}
                  language={language}
                  t={t}
                  savedHandle={null}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {events.length === 0 && !isLoading && (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
            <Lock className="h-12 w-12 mx-auto mb-4 text-white/10" />
            <p className="text-zinc-500 font-light">{t.noEvents}</p>
          </div>
        )}
      </div>

      {/* Application Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            // Optional: clear some state
          }
        }}
      >
        <DialogContent className="w-[95%] sm:max-w-md bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 text-white p-0 gap-0 overflow-hidden shadow-2xl shadow-amber-900/10 rounded-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
            <DialogTitle className="text-lg font-bold tracking-tight text-white/90">
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs font-mono">
               {selectedEvent && formatEventDate(new Date(selectedEvent.date), language)}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6">
            {isChecking && !application ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                     <Loader2 className="h-10 w-10 text-amber-200 animate-spin" />
                     <p className="text-sm text-zinc-500 animate-pulse font-light tracking-wide">{t.checking}</p>
                </div>
            ) : !application ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label htmlFor="handle" className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">
                    {t.instagramHandle}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-zinc-500 group-focus-within:text-amber-200 transition-colors">@</span>
                    </div>
                    <Input
                      ref={inputRef}
                      id="handle"
                      name="handle"
                      type="text"
                      placeholder={t.instagramPlaceholder}
                      defaultValue={savedHandle || ''}
                      required
                      autoComplete="off"
                      disabled={isSubmitting || isChecking}
                      className="pl-9 h-14 bg-white/5 border-white/10 text-base md:text-lg focus:border-amber-500/50 focus:ring-amber-500/20 transition-all rounded-xl placeholder:text-zinc-700 text-white"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 pl-1">
                    {t.instagramHint}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || isChecking}
                  className="w-full h-14 bg-amber-200 text-black hover:bg-white hover:scale-[1.01] transition-all rounded-xl font-bold tracking-wide text-sm shadow-[0_0_20px_rgba(253,230,138,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || isChecking ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.checking}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {checkStatusMode ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      {checkStatusMode ? t.checkStatus : t.submitApplication}
                    </div>
                  )}
                </Button>
                
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckStatusMode(!checkStatusMode)
                      setTimeout(() => inputRef.current?.focus(), 50)
                    }}
                    className="text-xs text-zinc-500 hover:text-white transition-colors underline underline-offset-4 decoration-zinc-700 hover:decoration-white"
                  >
                    {checkStatusMode ? t.newApplication : t.alreadyApplied}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                 <ApplicationStatusView
                   application={application}
                   event={selectedEvent}
                   language={language}
                   t={t}
                 />
                 
                 <div className="text-center border-t border-white/5 pt-4">
                    <button 
                      onClick={handleClearSession}
                      className="text-[10px] text-zinc-600 hover:text-white transition-colors uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
                    >
                      <LogOut className="h-3 w-3" />
                      {t.checkAnother}
                    </button>
                 </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

// --- SUBCOMPONENTS ---

interface EventCardProps {
  event: Event
  isActive: boolean
  isNextEvent: boolean
  onClick: () => void
  language: Language
  t: any
  savedHandle: string | null
}

function EventCard({ event, isActive, isNextEvent, onClick, language, t, savedHandle }: EventCardProps) {
  const hasImage = !!event.image_url

  return (
    <Card
      className={`
        w-full rounded-[2.5rem] relative overflow-hidden group border-0
        transition-all duration-500
        ${isNextEvent 
          ? 'cursor-pointer shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_70px_-10px_rgba(234,179,8,0.2)]' 
          : 'opacity-60 grayscale cursor-not-allowed'
        }
        /* FIX: Yükseklik Sabitlendi - Poster Modu */
        h-[550px] sm:h-[650px]
        ${!hasImage ? 'bg-zinc-900' : 'bg-black'}
      `}
      onClick={isNextEvent ? onClick : undefined}
    >
      {/* --- LAYER 1: BACKGROUND IMAGE --- */}
      {hasImage && (
        <div className="absolute inset-0 z-0">
          <img 
            src={event.image_url!} 
            alt={event.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Cinematic Gradient - Yazıların okunması için alt kısmı karartır */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 via-black/20 to-transparent" />
        </div>
      )}

      {/* --- LAYER 1.5: NO IMAGE FALLBACK --- */}
      {!hasImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black z-0">
           {isNextEvent && <div className="absolute inset-0 bg-amber-500/5 opacity-20" />}
        </div>
      )}

      {/* --- LAYER 2: TOP BADGES (Absolute Top) --- */}
      <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-start">
         {isNextEvent ? (
          <Badge className="bg-amber-500 text-black border-0 font-bold px-3 py-1 text-xs tracking-widest shadow-lg">
            <Sparkles className="h-3 w-3 mr-1" />
            {t.activeNow}
          </Badge>
         ) : (
          <>
            <Badge variant="outline" className="bg-black/40 text-white/70 border-white/10 backdrop-blur-md">
              {t.comingSoon}
            </Badge>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">
                UPCOMING
              </span>
            </div>
          </>
         )}
      </div>

      {/* --- LAYER 3: CONTENT ANCHOR (Absolute Bottom) --- */}
      {/* İşte butonu aşağı çivileyen kısım burası */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-6 sm:p-10 flex flex-col gap-6">
        
        {/* Text Group */}
        <div className="space-y-3">
          <CardTitle className={`text-4xl sm:text-5xl font-black tracking-tighter leading-[0.9] text-white drop-shadow-xl uppercase`}>
            {event.title}
          </CardTitle>
          
          <div className="flex flex-col gap-1.5">
             <div className="flex items-center gap-2 text-amber-300 font-bold tracking-wide text-sm sm:text-base shadow-black drop-shadow-md">
                <Calendar className="h-4 w-4" />
                <span>{formatEventDate(new Date(event.date), language)}</span>
             </div>
             <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium drop-shadow-md">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
             </div>
          </div>

          {!hasImage && event.description && (
            <p className="text-zinc-400 text-sm line-clamp-2 mt-2 font-light">
              {event.description}
            </p>
          )}
        </div>

        {/* Action Button - En altta */}
        {isNextEvent && (
          <Button
            className={`w-full h-14 sm:h-16 text-base sm:text-lg font-bold tracking-[0.2em] rounded-xl shadow-2xl transition-transform duration-200 active:scale-95
              ${savedHandle
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-amber-500 text-black hover:bg-amber-400'
              }
            `}
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            {savedHandle ? (
              <span className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                {t.myApplication}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t.applyForAccess}
              </span>
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}

function ApplicationStatusView({ application, event, language, t }: { application: ApplicationWithCode, event: any, language: Language, t: any }) {
  
  // Pending State - REDESIGNED PREMIUM VIBE
  if (application.status === 'pending') {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#0a0a0a] p-8 sm:p-10 text-center shadow-[0_0_30px_-10px_rgba(245,158,11,0.1)]">
        {/* Background Atmospheric Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-600/10 blur-[100px] rounded-full pointer-events-none opacity-70" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-400/5 blur-[100px] rounded-full pointer-events-none opacity-70" />

        <div className="relative z-10 flex flex-col items-center space-y-8">
          
          {/* Animated "Processing" Hub */}
          <div className="relative flex items-center justify-center my-4">
            {/* Outer Slow Rotating Ring */}
            <div className="absolute w-28 h-28 rounded-full border-2 border-transparent border-t-amber-500/60 border-r-amber-500/20 animate-[spin_4s_linear_infinite]" />
            {/* Inner Faster Rotating Ring */}
            <div className="absolute w-20 h-20 rounded-full border-2 border-transparent border-b-amber-300/50 border-l-amber-300/10 animate-[spin_2s_linear_infinite_reverse]" />
            
            {/* Center Pulsing Core */}
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 backdrop-blur-lg border border-amber-500/40 animate-pulse-slow shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Loader2 className="h-8 w-8 text-amber-300 animate-spin" />
            </div>
          </div>

          {/* Status Message & Details */}
          <div className="space-y-3">
            <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 tracking-tight drop-shadow-sm">
              {t.applicationReceived}
            </h3>
            <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed max-w-xs mx-auto">
              {t.reviewing}
            </p>
          </div>

          {/* Premium "PENDING" Badge */}
          <div>
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-amber-950/40 to-black/40 text-amber-200 border-amber-500/40 px-5 py-2 text-xs uppercase tracking-[0.25em] font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-300" />
              {t.statusPending}
            </Badge>
          </div>

        </div>

        {/* Subtle Light Accent at Bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent blur-[1px]" />
      </div>
    )
  }

  if (application.status === 'rejected') {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
         <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/20">
            <XCircle className="h-8 w-8 text-red-400" />
         </div>
         <div>
            <h3 className="text-lg font-medium text-white mb-2">{t.applicationRejected}</h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">{t.notApproved}</p>
         </div>
      </div>
    )
  }

  return (
    <div className="animate-in slide-in-from-bottom-5 duration-500">
       <div className="relative overflow-hidden rounded-xl border border-amber-200/20 bg-gradient-to-b from-[#1a1a1a] to-black">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-50" />
          
          <div className="p-8 flex flex-col items-center text-center space-y-6">
             <div className="space-y-2">
                <h3 className="text-xs font-bold tracking-[0.3em] text-amber-200 uppercase">{t.accessGranted}</h3>
                <h2 className="text-2xl font-black text-white tracking-tight">{CLUB_NAME}</h2>
             </div>

             <div className="p-4 bg-white rounded-xl shadow-2xl shadow-amber-900/20">
                {application.assigned_code ? (
                  <QRCode
                    value={application.assigned_code}
                    size={180}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                ) : (
                  <div className="w-[180px] h-[180px] bg-zinc-100 flex items-center justify-center">
                    <span className="text-xs text-zinc-400 font-mono">CODE GEN ERROR</span>
                  </div>
                )}
             </div>

             <div className="w-full border-t border-dashed border-white/10 pt-6">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">{t.yourAccessCode}</p>
                <p className="text-3xl font-mono text-white tracking-[0.2em] font-light">
                  {application.assigned_code || '----'}
                </p>
             </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-4 bg-[#0a0a0a]" style={{maskImage: 'radial-gradient(circle at 10px, transparent 5px, black 6px)', maskSize: '20px 20px', maskRepeat: 'repeat-x'}}></div>
       </div>
       
       <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-wider animate-pulse">
          {t.screenshotHint}
       </p>
    </div>
  )
}
