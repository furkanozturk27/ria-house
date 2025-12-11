'use client'

import { useState, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, CheckCircle2, XCircle, RefreshCw, ArrowLeft, Flashlight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// --- TYPES ---
type ScanStatus = 'idle' | 'scanning' | 'processing' | 'approved' | 'rejected' | 'used' | 'error'

export default function ScannerPage() {
  const [status, setStatus] = useState<ScanStatus>('scanning')
  const [message, setMessage] = useState<string>('Kamera Hazır')
  const [scannedData, setScannedData] = useState<any>(null)
  const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([])
  const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(undefined)

  // Kamera cihazlarını listele (Arka kamera seçimi için)
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const cameras = devices.filter((device) => device.kind === 'videoinput')
      setDeviceList(cameras)
      // Genelde son kamera arka kameradır, basit bir varsayım
      if (cameras.length > 0) {
        // setActiveDeviceId(cameras[cameras.length - 1].deviceId) 
        // Not: Kütüphane genelde otomaitk environment (arka) seçer ama gerekirse burayı açabiliriz.
      }
    })
  }, [])

  const handleScan = async (text: string | null) => {
    if (!text || status !== 'scanning') return

    setStatus('processing')
    setMessage('Kod Kontrol Ediliyor...')

    try {
      // 1. KODU VERİTABANINDA BUL
      const { data: codeData, error: fetchError } = await supabase
        .from('codes')
        .select(`
          *,
          applications (
            instagram_handle,
            status
          )
        `)
        .eq('code', text)
        .single()

      if (fetchError || !codeData) {
        setStatus('rejected')
        setMessage('GEÇERSİZ KOD! Veritabanında bulunamadı.')
        playFeedback('error')
        return
      }

      // 2. KOD ZATEN KULLANILMIŞ MI?
      if (codeData.scanned_at) {
        setStatus('used')
        const usedDate = new Date(codeData.scanned_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        setMessage(`BU KOD ZATEN KULLANILDI!\nGiriş Saati: ${usedDate}`)
        setScannedData(codeData)
        playFeedback('error')
        return
      }

      // 3. BAŞVURU ONAYLI MI? (Ekstra güvenlik)
      // @ts-ignore
      if (codeData.applications?.status !== 'approved') {
        setStatus('rejected')
        setMessage('BAŞVURU ONAYLI DEĞİL!')
        playFeedback('error')
        return
      }

      // 4. GİRİŞİ ONAYLA (Veritabanına işle)
      const { error: updateError } = await supabase
        .from('codes')
        .update({ scanned_at: new Date().toISOString() })
        .eq('id', codeData.id)

      if (updateError) throw updateError

      setStatus('approved')
      // @ts-ignore
      setMessage(`GİRİŞ ONAYLANDI\n${codeData.applications?.instagram_handle}`)
      setScannedData(codeData)
      playFeedback('success')

    } catch (error: any) {
      console.error('Scan Error:', error)
      setStatus('error')
      setMessage('Sistem Hatası: ' + error.message)
      playFeedback('error')
    }
  }

  // Sesli/Titreşimli Geri Bildirim
  const playFeedback = (type: 'success' | 'error') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') navigator.vibrate([100, 50, 100]) // Çift titreşim
      else navigator.vibrate([300]) // Uzun titreşim
    }
    
    // Ses efekti eklenebilir (opsiyonel)
    // const audio = new Audio(type === 'success' ? '/beep-success.mp3' : '/beep-error.mp3')
    // audio.play().catch(e => console.log('Audio play failed', e))
  }

  const resetScanner = () => {
    setStatus('scanning')
    setMessage('Kamera Hazır')
    setScannedData(null)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <div className="z-20 p-4 flex items-center justify-between bg-black/50 backdrop-blur-md border-b border-white/10 absolute top-0 w-full">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold tracking-widest text-amber-500">BOUNCER MODE</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Scanner Area */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Full Screen Camera Layer */}
        {status === 'scanning' || status === 'processing' ? (
          <div className="flex-1 relative bg-black">
             <Scanner 
                onResult={(text, result) => handleScan(text)}
                onError={(error) => console.log(error?.message)}
                options={{
                    delayBetweenScanAttempts: 300,
                    delayBetweenScanSuccess: 1000,
                }}
                components={{
                    audio: false, // Custom audio handling
                    finder: false // Custom finder overlay below
                }}
                styles={{
                    container: { height: '100%', width: '100%' },
                    video: { height: '100%', objectFit: 'cover' }
                }}
             />
             
             {/* Custom Finder Overlay (Lazer Görünümü) */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-64 border-2 border-amber-500/50 rounded-3xl">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl -mb-1 -mr-1"></div>
                    
                    {/* Scanning Line Animation */}
                    <motion.div 
                        animate={{ top: ['10%', '90%', '10%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                    />
                </div>
                <p className="absolute mt-80 text-white/70 text-sm font-mono tracking-widest bg-black/60 px-4 py-1 rounded-full backdrop-blur-sm">
                    QR KODU OKUTUN
                </p>
             </div>
          </div>
        ) : null}

        {/* Result Overlay (Success/Fail Screen) */}
        <AnimatePresence mode="wait">
          {status !== 'scanning' && status !== 'processing' && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`
                absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center
                ${status === 'approved' ? 'bg-green-600' : ''}
                ${status === 'rejected' || status === 'error' ? 'bg-red-600' : ''}
                ${status === 'used' ? 'bg-amber-600' : ''}
              `}
            >
              <motion.div 
                initial={{ scale: 0.5 }} 
                animate={{ scale: 1 }} 
                className="mb-6 bg-white rounded-full p-4 shadow-2xl"
              >
                {status === 'approved' && <CheckCircle2 className="h-20 w-20 text-green-600" />}
                {(status === 'rejected' || status === 'error') && <XCircle className="h-20 w-20 text-red-600" />}
                {status === 'used' && <RefreshCw className="h-20 w-20 text-amber-600" />}
              </motion.div>

              <h2 className="text-3xl font-black uppercase tracking-tight mb-2 text-white">
                {status === 'approved' && 'GİRİŞ BAŞARILI'}
                {status === 'rejected' && 'GİRİŞ REDDEDİLDİ'}
                {status === 'used' && 'ZATEN GİRİLDİ'}
                {status === 'error' && 'HATA'}
              </h2>
              
              <p className="text-white/90 text-xl font-medium whitespace-pre-line leading-relaxed mb-12">
                {message}
              </p>

              <Button 
                onClick={resetScanner}
                size="lg"
                className="bg-white text-black hover:bg-white/90 w-full h-16 text-xl font-bold rounded-2xl shadow-xl"
              >
                YENİ TARAMA YAP
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        {status === 'processing' && (
            <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 className="h-16 w-16 text-amber-500 animate-spin mb-4" />
                <p className="text-amber-500 font-mono animate-pulse">DOĞRULANIYOR...</p>
            </div>
        )}

      </div>
    </div>
  )
}

