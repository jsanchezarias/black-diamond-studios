import { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { 
  Video,
  Users,
  Heart, 
  MessageCircle, 
  Share2,
  Maximize,
  Volume2,
  VolumeX,
  Settings,
  Clock,
  Radio,
  DollarSign,
  Send,
  Play
} from 'lucide-react';
import { supabase } from '../../utils/supabase/info';
import Hls from 'hls.js';

interface StreamSession {
  sedeId?: string;
  sedeName?: string;
  streamUrl: string;
  isLive: boolean;
  viewers?: number;
}

interface BoutiqueStreamPlayerProps {
  modelId: string;
  modelName: string;
  modelPhoto?: string;
  streamUrl?: string;
  onTimeExpired?: () => void;
  onTipClick?: () => void;
}

const WATCH_TIME_LIMIT = 4 * 60; // 4 minutes
const COOLDOWN_TIME = 60 * 60 * 1000; // 1 hour

export function BoutiqueStreamPlayer({ 
  modelId, 
  modelName, 
  modelPhoto,
  streamUrl,
  onTimeExpired,
  onTipClick
}: BoutiqueStreamPlayerProps) {
  const [session, setSession] = useState<StreamSession | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(WATCH_TIME_LIMIT);
  const [isBlurred, setIsBlurred] = useState(false);
  const [canWatch, setCanWatch] = useState(true);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [chatMessages, setChatMessages] = useState<{ id: string, user: string, text: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamUrl) {
      setSession({ streamUrl, isLive: true });
      setIsLive(true);
      setViewers(Math.floor(Math.random() * 50) + 10);
      return;
    }
    checkActiveSession();
    const interval = setInterval(checkActiveSession, 10000); // Check every 10 secs
    return () => clearInterval(interval);
  }, [modelId, streamUrl]);

  const checkActiveSession = async () => {
    try {
      const { data, error } = await supabase
        .from('stream_configs')
        .select('stream_url, is_live, viewers')
        .eq('is_live', true)
        .limit(1);

      if (!error && data && data.length > 0) {
        const streamData = data[0];
        setSession({ streamUrl: streamData.stream_url, isLive: true });
        setIsLive(true);
        setViewers(streamData.viewers || Math.floor(Math.random() * 50) + 10);
      } else {
        setIsLive(false);
        setSession(null);
      }
    } catch {
      setIsLive(false);
      setSession(null);
    }
  };

  // 2. Setup Realtime Chat
  useEffect(() => {
    if (!isLive) return;

    const channel = supabase.channel(`stream_chat_${modelId}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        setChatMessages(prev => [...prev, payload.payload]);
      })
      .on('broadcast', { event: 'new_like' }, () => {
        setLikes(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLive, modelId]);
  
  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, showChat]);

  const sendChatMessage = async () => {
    if (!newMessage.trim()) return;
    
    const msg = {
      id: Math.random().toString(),
      user: "Usuario", // Or get the actual logged-in user name
      text: newMessage.trim()
    };
    
    // Optimistic update
    setChatMessages(prev => [...prev, msg]);
    setNewMessage("");

    await supabase.channel(`stream_chat_${modelId}`).send({
      type: 'broadcast',
      event: 'new_message',
      payload: msg
    });
  };

  // 3. Setup HLS Video
  useEffect(() => {
    if (isPlaying && session?.streamUrl && videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(session.streamUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(e => process.env.NODE_ENV === 'development' && console.error("Playback prevented", e));
        });

        return () => hls.destroy();
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = session.streamUrl;
        videoRef.current.play().catch(e => process.env.NODE_ENV === 'development' && console.error("Playback prevented", e));
      }
    }
  }, [isPlaying, session?.streamUrl]);

  // 4. Timer && Cooldown Logic
  useEffect(() => {
    checkCooldown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!canWatch && cooldownRemaining > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        const lastWatchTime = localStorage.getItem('lastStreamWatch');
        if (lastWatchTime) {
          const elapsed = Date.now() - parseInt(lastWatchTime);
          const remaining = COOLDOWN_TIME - elapsed;
          if (remaining <= 0) {
            setCanWatch(true);
            setCooldownRemaining(0);
            if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
          } else {
            setCooldownRemaining(remaining);
          }
        }
      }, 1000);
    }
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, [canWatch, cooldownRemaining]);

  const checkCooldown = () => {
    const lastWatchTime = localStorage.getItem('lastStreamWatch');
    if (lastWatchTime) {
      const elapsed = Date.now() - parseInt(lastWatchTime);
      const remaining = COOLDOWN_TIME - elapsed;
      if (remaining > 0) {
        setCanWatch(false);
        setCooldownRemaining(remaining);
        return false;
      }
    }
    setCanWatch(true);
    return true;
  };

  const handlePlayClick = () => {
    if (!canWatch) return;
    setIsPlaying(true);
    localStorage.setItem('lastStreamWatch', Date.now().toString());

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsBlurred(true);
          setTimeout(() => onTimeExpired?.(), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLike = async () => {
    if (!hasLiked) {
      setHasLiked(true);
      setLikes(prev => prev + 1);
      // Publish to channel
      await supabase.channel(`stream_chat_${modelId}`).send({
        type: 'broadcast',
        event: 'new_like',
        payload: { liked: true }
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${modelName} en vivo`,
        text: `Mira la transmisión en vivo de ${modelName}`,
        url: window.location.href,
      });
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const toggleFullscreen = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
         // Some browser compatibility fallbacks might be needed for actual production, 
        // but this works for 90%
        if(videoElement.requestFullscreen) videoElement.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCooldownTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  if (!isLive) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1014 0%, #1a1208 50%, #0f1014 100%)' }}>
        <div className="text-center px-8">
          <div className="w-20 h-20 rounded-full border-2 border-primary/30 flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(201,169,97,0.08)' }}>
            <Radio className="w-9 h-9" style={{ color: '#c9a961' }} />
          </div>
          <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#c9a961' }}>
            Sin transmisión en vivo
          </h3>
          <p className="text-sm mb-6" style={{ color: '#888' }}>
            {modelName} no está transmitiendo en este momento
          </p>
          <Badge variant="outline" className="border-primary/30 text-primary">
            <Clock className="w-3 h-3 mr-1" /> Vuelve pronto
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <Card className="border-primary/20 bg-gradient-card overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black group overflow-hidden">
            
            {!canWatch ? (
              // CD View
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-md z-20 p-4">
                <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-4 animate-pulse border border-red-500/50">
                  <Clock className="w-12 h-12 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-white">Tiempo de Espera</h2>
                <div className="bg-background/80 rounded-lg p-4 border border-primary/20 text-center">
                  <p className="text-sm text-gray-300 mb-2">Disponible en:</p>
                  <p className="text-3xl font-bold text-primary">{formatCooldownTime(cooldownRemaining)}</p>
                </div>
              </div>
            ) : !isPlaying ? (
              // Pre-play view
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black to-black/40 z-20">
                 {modelPhoto && (
                   <img src={modelPhoto} className="absolute inset-0 w-full h-full object-cover opacity-30 select-none pointer-events-none" alt="" />
                 )}
                 <div 
                  className="w-24 h-24 rounded-full bg-primary/20 hover:bg-primary/40 flex items-center justify-center mb-6 cursor-pointer border border-primary/50 transition-all hover:scale-110 shadow-[0_0_30px_rgba(212,175,55,0.3)] z-30 backdrop-blur-sm"
                  onClick={handlePlayClick}
                >
                  <Play className="w-10 h-10 text-primary ml-1" fill="currentColor" />
                </div>
                <h2 className="text-2xl font-bold mb-2 z-30" style={{ fontFamily: 'Playfair Display, serif' }}>{modelName} - Live Show</h2>
                <Badge className="bg-red-600 z-30 border-none font-semibold animate-pulse text-xs"><Radio className="w-3 h-3 mr-1"/> EN VIVO</Badge>
              </div>
            ) : (
               // Playing view
              <>
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover transition-all duration-1000 ${isBlurred ? 'blur-xl scale-110' : ''}`}
                  playsInline
                  autoPlay
                  muted={isMuted}
                />
                
                {isBlurred && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 transition-all duration-500">
                     <div className="text-center">
                       <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                       <h3 className="text-xl font-bold mb-2 text-white">Prueba Finalizada</h3>
                     </div>
                  </div>
                )}
                
                {/* Live Controls */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  <Badge className="bg-red-600/90 text-white border-none shadow-lg">
                    <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></div> VIVO
                  </Badge>
                  <Badge className="bg-black/60 backdrop-blur-sm text-white">
                    <Users className="w-3 h-3 mr-1" /> {viewers}
                  </Badge>
                </div>

                <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2 text-right">
                  <Badge className={`bg-black/80 font-bold backdrop-blur-md shadow-lg ${timeRemaining < 60 ? 'text-red-400' : 'text-primary'}`}>
                    <Clock className="w-3 h-3 mr-1" /> {formatTime(timeRemaining)}
                  </Badge>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 h-8 w-8 p-0" onClick={toggleMute}>
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 h-8 w-8 p-0">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 h-8 w-8 p-0 text-primary" onClick={onTipClick}>
                        <DollarSign className="w-4 h-4" />
                     </Button>
                     <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 h-8 w-8 p-0" onClick={toggleFullscreen}>
                        <Maximize className="w-4 h-4" />
                     </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-t border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {modelPhoto ? (
                  <img src={modelPhoto} className="w-10 h-10 rounded-full border border-primary/40 object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-primary/40 bg-zinc-900 flex items-center justify-center">
                    <Video className="w-5 h-5 text-zinc-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold">{modelName}</h3>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Show Privado en Vivo</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant={hasLiked ? "default" : "outline"} className={hasLiked ? "bg-red-600 hover:bg-red-700 text-white" : "border-primary/30"} onClick={handleLike}>
                  <Heart className={`w-4 h-4 mr-1 ${hasLiked ? 'fill-current' : ''}`} /> {likes}
                </Button>
                <Button size="sm" variant="outline" className="border-primary/30" onClick={() => setShowChat(!showChat)}>
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-primary/30" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Realtime Chat */}
      {showChat && (
         <Card className="border-primary/20 bg-gradient-card">
          <CardContent className="p-4 flex flex-col" style={{ height: "300px" }}>
            <h4 className="font-semibold text-sm mb-3 text-primary flex items-center gap-1"><MessageCircle className="w-4 h-4" /> Chat Público</h4>
            
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-thin scrollbar-thumb-primary/20 pr-2">
              {chatMessages.length === 0 ? (
                 <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                    <p>Escribe el primer mensaje en el chat</p>
                 </div>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg.id} className="text-sm bg-black/30 rounded-lg p-2 max-w-[90%] w-fit">
                    <span className="font-semibold text-primary mr-2" style={{ fontSize: "0.8rem"}}>{msg.user}</span>
                    <span className="text-gray-200">{msg.text}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                placeholder="Escribe un mensaje simpático..." 
                className="flex-1 bg-black/40 border-primary/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={!isLive || !canWatch}
              />
              <Button size="icon" className="shrink-0" onClick={sendChatMessage} disabled={!isLive || !canWatch || !newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
         </Card>
      )}
    </div>
  );
}
