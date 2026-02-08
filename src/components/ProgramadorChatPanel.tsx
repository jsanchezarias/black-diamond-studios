import { Badge } from './ui/badge';
import { Send, Users, MessageSquare, Gem, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../src/utils/supabase/info'; // ✅ Corregido: ruta correcta

interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  color?: string;
  role?: string;
  userId?: string;
  receiverId?: string;
  isVIP?: boolean;
}

interface ProgramadorChatPanelProps {
  userId: string;
  userEmail: string;
}

export function ProgramadorChatPanel({ userId, userEmail }: ProgramadorChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cargar mensajes desde Supabase
  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    loadOnlineUsers();
  }, []);

  const loadMessages = async () => {
    try {
      // Usar JOIN con tabla clientes
      const { data, error } = await supabase
        .from('chat_mensajes_publicos')
        .select(`
          id,
          message,
          created_at,
          sender_id,
          receiver_id,
          role,
          color,
          sender:sender_id(nombre, telefono, email),
          receiver:receiver_id(nombre, telefono)
        `)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('❌ Error cargando mensajes:', error);
        return;
      }

      if (data) {
        const formattedMessages: Message[] = data.map((msg: any) => {
          const username = msg.sender?.nombre || 'Usuario';
          // Detectar si es programador por el email
          const isProgramador = msg.role === 'programador' || msg.sender?.email === 'programador@app.com';
          
          return {
            id: msg.id,
            username: username,
            message: msg.message,
            timestamp: msg.created_at,
            role: msg.role || (isProgramador ? 'programador' : 'user'),
            userId: msg.sender_id,
            receiverId: msg.receiver_id,
            isVIP: false,
            color: msg.color || (isProgramador ? '#d4af37' : '#ffffff')
          };
        });
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('Error completo:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('chat_mensajes_publicos_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_mensajes_publicos'
        },
        () => {
          loadMessages(); // Recargar mensajes cuando hay uno nuevo
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadOnlineUsers = async () => {
    try {
      const { count, error } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Últimos 5 minutos

      if (!error && count !== null) {
        setOnlineUsers(count);
      }
    } catch (err) {
      console.error('Error cargando usuarios online:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      // Obtener usuario programador desde tabla clientes
      const { data: existingUser, error: checkError } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', userEmail)
        .single();

      let programadorChatId = existingUser?.id;

      if (!existingUser) {
        console.error('❌ Usuario programador no encontrado. Debe ser creado primero en la configuración del chat.');
        alert('Error: Usuario programador no configurado. Ve a Configuración > Chat para crearlo.');
        return;
      }

      // Enviar el mensaje
      const { error: sendError } = await supabase
        .from('chat_mensajes_publicos')
        .insert({
          sender_id: programadorChatId,
          message: messageInput.trim(),
          role: 'programador',
          color: '#d4af37'
        });

      if (sendError) {
        console.error('❌ Error enviando mensaje:', sendError);
        alert('Error al enviar mensaje. Intenta de nuevo.');
        return;
      }

      // Limpiar input
      setMessageInput('');
      
      // Recargar mensajes
      await loadMessages();
    } catch (err) {
      console.error('Error completo al enviar mensaje:', err);
      alert('Error al enviar mensaje. Intenta de nuevo.');
    }
  };

  const clearAllMessages = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar TODOS los mensajes del chat?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_mensajes_publicos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos

      if (error) {
        console.error('Error eliminando mensajes:', error);
        alert('Error al eliminar mensajes. Intenta de nuevo.');
        return;
      }

      // Opcional: Crear mensaje de sistema
      const { data: systemUser } = await supabase
        .from('clientes')
        .select('id')
        .eq('nombre', 'Sistema')
        .single();

      if (systemUser) {
        await supabase
          .from('chat_mensajes_publicos')
          .insert({
            sender_id: systemUser.id,
            message: '¡Bienvenidos al chat! 💬 Regístrate para participar',
            role: 'system',
            color: '#d4af37'
          });
      }

      await loadMessages();
    } catch (err) {
      console.error('Error completo:', err);
      alert('Error al eliminar mensajes. Intenta de nuevo.');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="border-primary/30">
        <CardContent className="p-8">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Cargando chat...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Terminal de Chat - Programador
            </CardTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
              <Users className="w-3 h-3" />
              {onlineUsers} online
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Panel de Usuario Autenticado */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg border border-primary/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center">
                <Gem className="w-6 h-6 text-background" />
              </div>
              <div>
                <p className="font-bold text-lg">Black Diamond</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Autenticado como Programador
                </p>
              </div>
            </div>
            <Button 
              onClick={clearAllMessages}
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar Chat
            </Button>
          </div>

          {/* Vista de Mensajes (TODOS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-muted-foreground uppercase">
                Todos los Mensajes ({messages.length})
              </h4>
              <Badge variant="outline" className="text-xs">
                Como programador ves todos los mensajes
              </Badge>
            </div>
            <div className="h-[400px] overflow-y-auto bg-muted/30 rounded-lg p-4 space-y-3 border border-primary/20">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No hay mensajes aún</p>
                  <p className="text-sm text-muted-foreground/60 mt-2">
                    Sé el primero en enviar un mensaje
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.username === 'Sistema' 
                        ? 'bg-background/40 text-center' 
                        : msg.role === 'programador'
                        ? 'bg-gradient-to-r from-primary/20 to-amber-400/20 border-l-4 border-primary'
                        : 'bg-background/60 border-l-4 border-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-sm font-bold"
                          style={{ color: msg.color || '#d4af37' }}
                        >
                          {msg.username}
                        </span>
                        {msg.role === 'programador' && (
                          <Badge className="bg-primary text-background text-[10px] px-1.5 py-0">
                            MODERADOR
                          </Badge>
                        )}
                        {msg.isVIP && (
                          <Gem className="w-3 h-3 text-primary" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm break-words">{msg.message}</p>
                    {msg.userId && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        ID: {msg.userId.substring(0, 8)}...
                      </p>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input de Mensaje */}
          <form onSubmit={handleSendMessage} className="space-y-2">
            <label className="text-sm font-medium">Enviar mensaje como Black Diamond</label>
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Escribe un mensaje visible para todos..."
                className="flex-1 bg-background"
                maxLength={200}
              />
              <Button 
                type="submit"
                disabled={!messageInput.trim()}
                className="bg-primary text-background hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💬 Los usuarios regulares verán tus mensajes en el chat público
            </p>
          </form>

          {/* Información */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-sm font-bold mb-2 text-blue-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Reglas de Visibilidad
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✅ <strong>Programador (tú):</strong> Ve TODOS los mensajes de todos los usuarios</li>
              <li>✅ <strong>Usuarios regulares:</strong> Solo ven mensajes del Sistema, de Black Diamond, y sus propios mensajes</li>
              <li>❌ <strong>Usuarios regulares:</strong> NO ven mensajes de otros usuarios</li>
              <li>💎 <strong>Tu nombre en el chat:</strong> "Black Diamond" con badge dorado</li>
              <li>🔐 <strong>Autenticación:</strong> Ya estás autenticado con tu sesión de Supabase</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}