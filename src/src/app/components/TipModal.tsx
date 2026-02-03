import { X, DollarSign, Gem, Heart, Star, Zap, Crown, Sparkles, CreditCard, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useState } from 'react';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTip: (amount: number, message: string, paymentMethod: 'payu' | 'pse') => void;
  modelName: string;
  userPhone?: string; // Teléfono del usuario para identificar el pago
}

const tipOptions = [
  { amount: 10000, label: '$10.000', icon: Heart, color: 'from-pink-500 to-rose-500', badge: '💝' },
  { amount: 20000, label: '$20.000', icon: Star, color: 'from-purple-500 to-pink-500', badge: '⭐' },
  { amount: 50000, label: '$50.000', icon: Gem, color: 'from-blue-500 to-purple-500', badge: '💎' },
  { amount: 100000, label: '$100.000', icon: Zap, color: 'from-yellow-500 to-orange-500', badge: '⚡' },
  { amount: 200000, label: '$200.000', icon: Crown, color: 'from-amber-500 to-yellow-500', badge: '👑' },
  { amount: 500000, label: '$500.000', icon: Sparkles, color: 'from-primary to-amber-400', badge: '✨' },
];

const quickMessages = [
  '¡Eres increíble! 💕',
  '¡Hermosa! ❤️',
  '¡Me encanta tu show! 🌟',
  '¡Sigue así! 💎',
  '¡Espectacular! 🔥',
  '¡Gracias por todo! 💖',
];

export function TipModal({ isOpen, onClose, onSendTip, modelName, userPhone }: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'payu' | 'pse'>('payu');

  if (!isOpen) return null;

  const handleSendTip = async () => {
    const amount = selectedAmount || parseInt(customAmount);
    
    if (!amount || amount <= 0) {
      alert('Por favor selecciona o ingresa un monto válido');
      return;
    }

    setIsSending(true);
    
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onSendTip(amount, message, paymentMethod);
    
    // Reset y cerrar
    setSelectedAmount(null);
    setCustomAmount('');
    setMessage('');
    setIsSending(false);
    onClose();
  };

  const handleQuickMessage = (msg: string) => {
    setMessage(msg);
  };

  const finalAmount = selectedAmount || parseInt(customAmount) || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/95 backdrop-blur-lg" 
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border-primary/30 bg-gradient-to-br from-card to-primary/5 shadow-2xl shadow-primary/20">
        <CardContent className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center animate-pulse">
                  <DollarSign className="w-6 h-6 text-background" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Enviar <span className="text-primary">Propina</span>
                </h2>
              </div>
              <p className="text-muted-foreground">
                Apoya a <span className="text-primary font-semibold">{modelName}</span> con una propina
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="hover:bg-primary/10 rounded-full"
              disabled={isSending}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Montos Predefinidos */}
          <div className="mb-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Gem className="w-5 h-5 text-primary" />
              Selecciona un Monto
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tipOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedAmount === option.amount;
                
                return (
                  <button
                    key={option.amount}
                    onClick={() => {
                      setSelectedAmount(option.amount);
                      setCustomAmount('');
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/30 scale-105'
                        : 'border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 hover:scale-105'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center ${isSelected ? 'animate-pulse' : ''}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-2xl font-bold">{option.label}</span>
                      <span className="text-2xl">{option.badge}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-bounce">
                        <span className="text-background text-xs">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monto Personalizado */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              O Ingresa un Monto Personalizado
            </h3>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
              <input
                type="number"
                placeholder="Ingresa el monto"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="w-full pl-8 pr-4 py-3 bg-background/50 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg"
                min="1"
                disabled={isSending}
              />
            </div>
          </div>

          {/* Mensajes Rápidos */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Mensaje (Opcional)
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {quickMessages.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickMessage(msg)}
                  className="px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-full transition-all hover:scale-105"
                  disabled={isSending}
                >
                  {msg}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Escribe un mensaje personalizado..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-background/50 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              disabled={isSending}
            />
          </div>

          {/* 🆕 Método de Pago */}
          <div className="mb-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Método de Pago
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {/* PayU - Tarjetas */}
              <button
                onClick={() => setPaymentMethod('payu')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  paymentMethod === 'payu'
                    ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/30 scale-105'
                    : 'border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 hover:scale-105'
                }`}
                disabled={isSending}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ${paymentMethod === 'payu' ? 'animate-pulse' : ''}`}>
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-bold">PayU</span>
                  <span className="text-xs text-muted-foreground text-center">Tarjetas de crédito/débito</span>
                </div>
                {paymentMethod === 'payu' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-background text-xs">✓</span>
                  </div>
                )}
              </button>

              {/* PSE - Transferencia */}
              <button
                onClick={() => setPaymentMethod('pse')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  paymentMethod === 'pse'
                    ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/30 scale-105'
                    : 'border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 hover:scale-105'
                }`}
                disabled={isSending}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center ${paymentMethod === 'pse' ? 'animate-pulse' : ''}`}>
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-bold">PSE</span>
                  <span className="text-xs text-muted-foreground text-center">Transferencia bancaria</span>
                </div>
                {paymentMethod === 'pse' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-background text-xs">✓</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Resumen */}
          {finalAmount > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Monto a enviar:</span>
                <span className="text-3xl font-bold text-primary" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  ${finalAmount}
                </span>
              </div>
              {message && (
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <span className="text-sm text-muted-foreground">Tu mensaje:</span>
                  <p className="text-sm mt-1 italic">"{message}"</p>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="space-y-3">
            <Button
              onClick={handleSendTip}
              size="lg"
              disabled={isSending || finalAmount <= 0}
              className="w-full bg-gradient-to-r from-primary to-amber-400 hover:from-primary/90 hover:to-amber-400/90 text-background font-bold text-lg py-6"
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5 mr-2" />
                  Enviar ${finalAmount} de Propina
                </>
              )}
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              size="lg"
              className="w-full hover:bg-primary/10"
              disabled={isSending}
            >
              Cancelar
            </Button>
          </div>

          {/* Nota de seguridad */}
          <div className="mt-6 p-3 bg-background/50 rounded-lg border border-primary/10">
            <p className="text-xs text-muted-foreground text-center">
              🔒 Transacción segura y encriptada. Las propinas son procesadas de forma confidencial.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}