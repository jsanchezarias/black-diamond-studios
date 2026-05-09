import Hls from 'hls.js'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../../utils/supabase/info'

const STREAM_URL = 'https://stream.blackdiamondscorts.com/live/stream1/index.m3u8'
const RECONNECT_INTERVAL = 5000 // 5 segundos
const MAX_RECONNECT_ATTEMPTS = 20 // 100 segundos máximo

export const BDPremiumStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptCount = useRef(0)

  const [status, setStatus] = useState<'connecting' | 'live' | 'reconnecting' | 'offline'>('connecting')
  const [streamUrl, setStreamUrl] = useState<string>(STREAM_URL)

  // Leer URL desde Supabase (override del hardcoded si existe)
  useEffect(() => {
    const fetchUrl = async () => {
      const { data } = await supabase
        .from('stream_configs')
        .select('stream_url')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      if (data?.stream_url) setStreamUrl(data.stream_url)
    }
    fetchUrl()
  }, [])

  const destroyHls = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }, [])

  const initPlayer = useCallback(() => {
    if (!videoRef.current || !streamUrl) return
    const video = videoRef.current
    destroyHls()

    const hlsUrl = streamUrl.includes('.m3u8')
      ? streamUrl
      : streamUrl.replace(/\/$/, '') + '/index.m3u8'

    if (Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        maxBufferLength: 10,
        manifestLoadingTimeOut: 8000,
        manifestLoadingMaxRetry: 0, // Manejamos retry manualmente
      })
      hlsRef.current = hls

      hls.loadSource(hlsUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        attemptCount.current = 0
        setStatus('live')
        video.play().catch(console.error)
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return

        if (attemptCount.current >= MAX_RECONNECT_ATTEMPTS) {
          setStatus('offline')
          destroyHls()
          return
        }

        setStatus('reconnecting')
        attemptCount.current += 1
        console.warn(`Stream caído. Reconectando en 5s... (intento ${attemptCount.current})`)

        destroyHls()
        reconnectTimer.current = setTimeout(() => initPlayer(), RECONNECT_INTERVAL)
      })

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari nativo
      video.src = hlsUrl
      video.play().catch(console.error)
      setStatus('live')
    }
  }, [streamUrl, destroyHls])

  // Arrancar cuando streamUrl esté lista
  useEffect(() => {
    if (streamUrl) initPlayer()
    return () => destroyHls()
  }, [streamUrl])

  // Detectar si el usuario vuelve a tener internet
  useEffect(() => {
    const handleOnline = () => {
      if (status === 'reconnecting' || status === 'offline') {
        attemptCount.current = 0
        setStatus('connecting')
        initPlayer()
      }
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [status, initPlayer])

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        controls
        playsInline
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Badge de estado */}
      {status === 'live' && (
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: '#ef4444', color: '#fff',
          padding: '4px 10px', borderRadius: 6,
          fontSize: 12, fontWeight: 700, letterSpacing: 1
        }}>
          🔴 EN VIVO
        </div>
      )}

      {status === 'connecting' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14
        }}>
          ⏳ Conectando al stream...
        </div>
      )}

      {status === 'reconnecting' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, gap: 8, background: 'rgba(0,0,0,0.7)'
        }}>
          <span>🔄 Reconectando... (intento {attemptCount.current})</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>El stream volverá automáticamente</span>
        </div>
      )}

      {status === 'offline' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, gap: 12, background: 'rgba(0,0,0,0.85)'
        }}>
          <span>📡 Stream no disponible</span>
          <button
            onClick={() => { attemptCount.current = 0; setStatus('connecting'); initPlayer() }}
            style={{
              padding: '8px 20px', borderRadius: 8,
              background: '#ef4444', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: 13
            }}
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  )
}
