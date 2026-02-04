import { Badge } from './ui/badge';
import { Send, Users, MessageSquare, LogIn, LogOut, Gem, Trash2 } from 'lucide-react';
import { usePublicUsers } from '../src/app/components/PublicUsersContext';
import { supabase } from '../lib/supabaseClient';

export function ChatModeratorPanel() {
  const { currentUser, login, logout, sendMessage, messages, onlineUsers } = usePublicUsers();
  const [messageInput, setMessageInput] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>(''); // Usuario seleccionado para responder
  const [users, setUsers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cargar usuarios desde Supabase
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*');

    if (!error && data) {
      setUsers(data);
    }
  };

  // Obtener lista de usuarios únicos con mensajes
  const getUsersWithMessages = () => {
    const usersSet = new Set<string>();
    messages.forEach(msg => {
      if (msg.userId && msg.role === 'user') {
        usersSet.add(msg.userId);
      }
    });
    return Array.from(usersSet);
  };

  // Obtener mensajes filtrados por usuario seleccionado
  const getFilteredMessages = () => {
    if (!selectedUserId) return messages;
    
    return messages.filter(msg => {
      // Mensajes del sistema siempre visibles
      if (msg.role === 'system') return true;
      
      // Mensajes del usuario seleccionado
      if (msg.userId === selectedUserId) return true;
      
      // Mensajes del programador dirigidos al usuario seleccionado
      if (msg.role === 'programador' && msg.receiverId === selectedUserId) return true;
      
      return false;
    });
  };

  // Obtener información del usuario por ID
  const getUserInfo = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user || { username: 'Usuario desconocido', email: '' };
  };

  // Contar mensajes no leídos por usuario (simulado)
  const getUnreadCount = (userId: string) => {
    return messages.filter(msg => 
      msg.userId === userId && 
      msg.role === 'user' &&
      !msg.receiverId // Mensajes del usuario que no han sido respondidos
    ).length;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(loginEmail, loginPassword);
    if (success && currentUser?.role === 'programador') {
      setShowLoginForm(false);
      setLoginEmail('');
      setLoginPassword('');
    } else if (success && currentUser?.role !== 'programador') {
      logout();
      alert('Esta sección es solo para programadores');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    // Enviar mensaje al usuario seleccionado o a todos si no hay selección
    sendMessage(messageInput, selectedUserId || undefined);
    setMessageInput('');
  };

  const clearAllMessages = () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODOS los mensajes del chat?')) {
      localStorage.setItem('chat_messages_db', JSON.stringify([
        {
          id: '1',
          username: 'Sistema',
          message: '¡Bienvenidos al chat! 💬 Regístrate para participar',
          timestamp: new Date().toISOString(),
          color: '#d4af37'
        }
      ]));
      window.location.reload();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Moderación de Chat - Black Diamond
            </CardTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
              <Users className="w-3 h-3" />
              {onlineUsers} online
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Login del Moderador */}
          {!currentUser ? (
            <div className="space-y-4">
              {!showLoginForm ? (
                <div className="text-center p-8 bg-muted/50 rounded-lg border border-primary/20">
                  <MessageSquare className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Iniciar Sesión como Moderador</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Inicia sesión para moderar el chat como <strong>Black Diamond</strong>
                  </p>
                  <Button 
                    onClick={() => setShowLoginForm(true)}
                    className="bg-primary text-background hover:bg-primary/90 gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Iniciar Sesión
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4 p-6 bg-muted/50 rounded-lg border border-primary/20">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="programador@blackdiamond.com"
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contraseña</label>
                    <Input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Tu contraseña"
                      required
                      minLength={6}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-primary text-background hover:bg-primary/90">
                      <LogIn className="w-4 h-4 mr-2" />
                      Iniciar Sesión
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowLoginForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Usa el email: <strong>programador@blackdiamond.com</strong><br/>
                    Si es tu primera vez, crea una contraseña nueva.
                  </p>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Panel de Usuario Actual */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg border border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center">
                    <Gem className="w-6 h-6 text-background" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{currentUser.username}</p>
                    <p className="text-xs text-muted-foreground">Moderador del Chat</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={clearAllMessages}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar Chat
                  </Button>
                  <Button 
                    onClick={logout}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>

              {/* Vista de Mensajes (TODOS) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase">
                    Todos los Mensajes ({messages.length})
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    Como moderador ves todos los mensajes
                  </Badge>
                </div>
                <div className="h-[400px] overflow-y-auto bg-muted/30 rounded-lg p-4 space-y-3 border border-primary/20">
                  {messages.map((msg) => (
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
                          ID: {msg.userId}
                        </p>
                      )}
                    </div>
                  ))}
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
                <h4 className="text-sm font-bold mb-2 text-blue-400">ℹ️ Reglas de Visibilidad</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✅ <strong>Programador (tú):</strong> Ve TODOS los mensajes de todos los usuarios</li>
                  <li>✅ <strong>Usuarios regulares:</strong> Solo ven mensajes del Sistema, de Black Diamond, y sus propios mensajes</li>
                  <li>❌ <strong>Usuarios regulares:</strong> NO ven mensajes de otros usuarios</li>
                  <li>💎 <strong>Tu nombre en el chat:</strong> "Black Diamond" con badge dorado</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}