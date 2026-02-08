import { useState, useRef, useEffect } from 'react';
import { Send, Users, Gem, LogOut, LogIn, DollarSign } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { usePublicUsers } from './PublicUsersContext';

interface LiveChatProps {
  onTipClick?: () => void; // Prop para manejar el click de propinas
  recentTips?: Array<{ username: string; amount: number; timestamp: number }>; // Propinas recientes
  onLoginClick?: () => void; // NUEVO: Prop para abrir el modal de login desde el padre
}

export function LiveChat({ onTipClick, recentTips = [], onLoginClick }: LiveChatProps) {
  const { currentUser, logout, sendMessage, getVisibleMessages, onlineUsers, logoutRef } = usePublicUsers();
  const [messageInput, setMessageInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Obtener mensajes visibles según el rol
  const visibleMessages = getVisibleMessages();

  // ✅ Auto-scroll al inicio de sesión o cuando cambian los mensajes
  useEffect(() => {
    const container = chatContainerRef.current;
    
    if (!container) return;
    
    // Verificar si el usuario está cerca del final (dentro de 150px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    
    // Solo hacer scroll automático si el usuario ya está viendo el final
    // Usar scrollTop directamente en lugar de scrollIntoView para evitar afectar la página
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [visibleMessages]);

  // 🆕 Scroll automático cuando el usuario inicia sesión
  useEffect(() => {
    const container = chatContainerRef.current;
    
    if (!container || !currentUser) return;
    
    // Hacer scroll hasta el final cuando el usuario se loguea
    // Usar setTimeout para asegurar que los mensajes ya están renderizados
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
      console.log('📜 Scroll automático al final del chat tras login');
    }, 100);
  }, [currentUser]); // Se ejecuta cuando currentUser cambia (login)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      // Abrir modal de login del sistema principal
      if (onLoginClick) {
        onLoginClick();
      }
      return;
    }
    
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput('');
    }
  };

  // ✅ Manejar logout correctamente (función async)
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔴 CLICK en botón Cerrar Sesión - DENTRO DEL CHAT');
    console.log('🔴 currentUser:', currentUser);
    
    try {
      console.log('🔴 Llamando a logoutRef.current() desde LiveChat...');
      // ✅ USAR REF para evitar stale closures
      if (logoutRef?.current) {
        await logoutRef.current();
        console.log('🔴 logoutRef.current() completado desde LiveChat');
      } else {
        console.error('🔴 logoutRef.current no está disponible');
      }
    } catch (error) {
      console.error('🔴 Error al cerrar sesión desde LiveChat:', error);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0a0a0f] to-[#1a1a24] border-l border-primary/20">
      {/* Header del Chat */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 border-b border-primary/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-pulse">
              <Gem className="w-6 h-6 text-background" />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Chat en Vivo
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>En vivo ahora</span>
              </div>
            </div>
          </div>
          
          <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
            <Users className="w-3 h-3" />
            {onlineUsers} online
          </Badge>
        </div>

        {/* User Status */}
        {currentUser ? (
          <>
            <div className="flex items-center justify-between bg-background/40 rounded-lg p-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {currentUser.username}
                    {currentUser.isVIP && <Gem className="w-3 h-3 text-primary inline ml-1" />}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                size="sm"
                className="text-red-400 hover:text-red-500 hover:bg-red-950/20"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <Button 
            onClick={onLoginClick}
            className="w-full bg-primary text-background hover:bg-primary/90 gap-2"
          >
            <LogIn className="w-4 h-4" />
            Únete al Chat
          </Button>
        )}

        {/* Botón de Propinas */}
        {currentUser && onTipClick && (
          <Button 
            onClick={onTipClick}
            className="w-full mt-2 bg-gradient-to-r from-primary to-amber-400 hover:from-primary/90 hover:to-amber-400/90 text-background font-bold gap-2 animate-pulse"
          >
            <DollarSign className="w-4 h-4" />
            Enviar Propina
          </Button>
        )}

        {/* Propinas Recientes */}
        {recentTips.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground font-bold">💎 Propinas Recientes:</p>
            {recentTips.slice(-3).reverse().map((tip, index) => (
              <div key={index} className="flex items-center justify-between bg-gradient-to-r from-primary/20 to-amber-400/20 rounded-lg p-2 border border-primary/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center">
                    <DollarSign className="w-3 h-3 text-background" />
                  </div>
                  <span className="text-xs font-bold text-primary">{tip.username}</span>
                </div>
                <span className="text-sm font-bold text-primary">${tip.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mensajes */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
      >
        {visibleMessages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col gap-1 ${
              msg.username === 'Sistema' ? 'items-center' : 'items-start'
            }`}
          >
            {msg.username === 'Sistema' ? (
              <div className="text-xs text-center text-muted-foreground italic bg-background/40 px-3 py-1 rounded-full">
                {msg.message}
              </div>
            ) : (
              <div className="max-w-[85%]">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="text-xs font-bold"
                    style={{ color: msg.color || '#d4af37' }}
                  >
                    {msg.username}
                    {msg.isVIP && <Gem className="w-3 h-3 text-primary inline ml-1" />}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div className="bg-card/60 backdrop-blur-sm rounded-lg rounded-tl-none px-3 py-2 border border-border/50">
                  <p className="text-sm text-foreground break-words">{msg.message}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensaje */}
      <div className="border-t border-primary/20 p-4 bg-background/60 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={currentUser ? "Escribe un mensaje..." : "Inicia sesión para chatear..."}
            disabled={!currentUser}
            className="flex-1 bg-card/60 border-primary/20 focus:border-primary"
            maxLength={200}
          />
          <Button 
            type="submit" 
            disabled={!currentUser || !messageInput.trim()}
            className="bg-primary text-background hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        {!currentUser && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            <button 
              onClick={onLoginClick}
              className="text-primary hover:underline"
            >
              Regístrate o inicia sesión
            </button> para participar en el chat
          </p>
        )}
      </div>
    </div>
  );
}