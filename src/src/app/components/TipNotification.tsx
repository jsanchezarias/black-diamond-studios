import { DollarSign, Gem, Crown, Sparkles, Zap, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface TipData {
  id: string;
  username: string;
  amount: number;
  message?: string;
  timestamp: number;
}

interface TipNotificationProps {
  tip: TipData;
  onComplete: () => void;
}

export function TipNotification({ tip, onComplete }: TipNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 100);

    // Fade out y eliminar
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getTipIcon = (amount: number) => {
    if (amount >= 500) return { Icon: Sparkles, emoji: '✨', color: 'from-primary to-amber-400' };
    if (amount >= 200) return { Icon: Crown, emoji: '👑', color: 'from-amber-500 to-yellow-500' };
    if (amount >= 100) return { Icon: Zap, emoji: '⚡', color: 'from-yellow-500 to-orange-500' };
    if (amount >= 50) return { Icon: Gem, emoji: '💎', color: 'from-blue-500 to-purple-500' };
    if (amount >= 20) return { Icon: Heart, emoji: '⭐', color: 'from-purple-500 to-pink-500' };
    return { Icon: Heart, emoji: '💝', color: 'from-pink-500 to-rose-500' };
  };

  const { Icon, emoji, color } = getTipIcon(tip.amount);

  return (
    <div
      className={`transition-all duration-500 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`bg-gradient-to-r ${color} p-1 rounded-lg shadow-2xl animate-pulse-slow`}>
        <div className="bg-background/95 backdrop-blur-sm rounded-md p-4">
          <div className="flex items-center gap-3">
            {/* Icono animado */}
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center animate-bounce`}>
              <Icon className="w-6 h-6 text-white" />
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-primary truncate">{tip.username}</span>
                <span className="text-xl">{emoji}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold text-primary" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  ${tip.amount}
                </span>
              </div>
              {tip.message && (
                <p className="text-xs text-muted-foreground mt-1 truncate italic">
                  "{tip.message}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TipNotificationsContainerProps {
  tips: TipData[];
  onRemoveTip: (id: string) => void;
}

export function TipNotificationsContainer({ tips, onRemoveTip }: TipNotificationsContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {tips.map((tip) => (
        <TipNotification
          key={tip.id}
          tip={tip}
          onComplete={() => onRemoveTip(tip.id)}
        />
      ))}
    </div>
  );
}
