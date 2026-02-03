import { Logo } from './Logo';
import { supabase } from '../../../lib/supabaseClient';

interface ConversacionUsuario {
  userId: string;
  username: string;
  telefono: string;
  avatar?: string;
  isVIP: boolean;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  userId: string;
  isVIP?: boolean;
}

export function ProgramadorChatLanding() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginTelefono, setLoginTelefono] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [programadorId, setProgramadorId] = useState<string>('');
  const [programadorUsername, setProgramadorUsername] = useState<string>('');

  // Estados del panel de chat
  const [conversaciones, setConversaciones] = useState<ConversacionUsuario[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  
  // Estados de transmisión
  const [streamUrl, setStreamUrl] = useState('');
  const [streamActive, setStreamActive] = useState(false);
  const [editingStream, setEditingStream] = useState(false);
  const [newStreamUrl, setNewStreamUrl] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ✅ CORREGIDO: Auto-scroll SOLO dentro del contenedor del chat (NO afecta la página principal)
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
  }, [messages]);

  // Cargar conversaciones cuando se autentica
  useEffect(() => {
    if (isAuthenticated) {
      loadConversaciones();
      const interval = setInterval(loadConversaciones, 3000); // Actualizar cada 3 segundos
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Cargar mensajes cuando selecciona una conversación
  useEffect(() => {
    if (selectedUserId && programadorId) {
      loadMessages(selectedUserId);
      const interval = setInterval(() => loadMessages(selectedUserId), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedUserId, programadorId]);

  // Login del programador
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Limpiar teléfono
      const telefonoLimpio = loginTelefono.replace(/\D/g, '');

      // Buscar en la tabla clientes
      const { data: user, error } = await supabase
        .from('clientes')
        .select('id, nombre, telefono, email')
        .eq('telefono', telefonoLimpio)
        .single();

      if (error || !user) {
        // Intentar con email si el teléfono no funciona
        const { data: userByEmail, error: emailError } = await supabase
          .from('clientes')
          .select('id, nombre, telefono, email')
          .eq('email', 'programador@app.com')
          .single();

        if (emailError || !userByEmail) {
          alert('❌ Credenciales incorrectas. Usa el teléfono: 3000000000 o email: programador@app.com');
          return;
        }

        // ✅ Login exitoso (sin verificación de contraseña por ahora)
        setProgramadorId(userByEmail.id);
        setProgramadorUsername(userByEmail.nombre);
        setIsAuthenticated(true);
        return;
      }

      // Verificar que sea el programador (por email)
      if (user.email !== 'programador@app.com') {
        alert('❌ Solo el programador puede acceder a este panel');
        return;
      }

      // ✅ Login exitoso
      setProgramadorId(user.id);
      setProgramadorUsername(user.nombre);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error en login:', error);
      alert('❌ Error al iniciar sesión');
    }
  };

  // Cargar todas las conversaciones
  const loadConversaciones = async () => {
    try {
      console.log('🔄 Cargando conversaciones... programadorId:', programadorId);
      
      // Obtener todos los mensajes y extraer los clientes únicos
      const { data: mensajes, error } = await supabase
        .from('chat_mensajes_publicos')
        .select(`
          id,
          sender_id,
          receiver_id,
          message,
          created_at,
          sender:sender_id(id, nombre, telefono)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando conversaciones:', error);
        return;
      }

      console.log('✅ Mensajes obtenidos:', mensajes?.length || 0);

      // Agrupar por cliente (excluir al programador)
      const usuariosMap = new Map<string, ConversacionUsuario>();

      for (const msg of mensajes || []) {
        // Identificar al cliente (puede ser sender o receiver)
        let cliente = null;
        let clienteId = null;

        if (msg.sender_id === programadorId) {
          // El programador envió, el cliente es el receiver
          clienteId = msg.receiver_id;
        } else {
          // El cliente envió, extraer del sender
          cliente = (msg as any).sender;
          clienteId = msg.sender_id;
        }

        if (!clienteId || clienteId === programadorId || usuariosMap.has(clienteId)) continue;

        // Si no tenemos datos del cliente, buscarlos
        if (!cliente && clienteId) {
          const { data: clienteData } = await supabase
            .from('clientes')
            .select('id, nombre, telefono')
            .eq('id', clienteId)
            .single();
          
          cliente = clienteData;
        }

        if (!cliente) continue;

        // Obtener último mensaje de esta conversación
        const { data: lastMsg } = await supabase
          .from('chat_mensajes_publicos')
          .select('message, created_at')
          .or(`and(sender_id.eq.${clienteId},receiver_id.eq.${programadorId}),and(sender_id.eq.${programadorId},receiver_id.eq.${clienteId})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        usuariosMap.set(clienteId, {
          userId: clienteId,
          username: cliente.nombre,
          telefono: cliente.telefono,
          avatar: undefined,
          isVIP: false,
          lastMessage: lastMsg?.message || 'Sin mensajes',
          lastMessageTime: lastMsg ? new Date(lastMsg.created_at) : new Date(),
          unreadCount: 0
        });
      }

      console.log('✅ Conversaciones cargadas:', usuariosMap.size);
      setConversaciones(Array.from(usuariosMap.values()));
    } catch (error) {
      console.error('❌ Error cargando conversaciones:', error);
    }
  };

  // Cargar mensajes de una conversación
  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_mensajes_publicos')
        .select(`
          id,
          message,
          created_at,
          sender_id,
          sender:sender_id(nombre)
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${programadorId}),and(sender_id.eq.${programadorId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error cargando mensajes:', error);
        return;
      }

      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        username: msg.sender?.nombre || 'Usuario',
        message: msg.message,
        timestamp: new Date(msg.created_at),
        userId: msg.sender_id,
        isVIP: false
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('❌ Error cargando mensajes:', error);
    }
  };

  // Enviar mensaje
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedUserId) return;

    try {
      const { error } = await supabase
        .from('chat_mensajes_publicos')
        .insert({
          sender_id: programadorId,
          receiver_id: selectedUserId,
          message: messageInput.trim()
        });

      if (error) {
        console.error('Error enviando mensaje:', error);
        alert('❌ Error al enviar mensaje');
        return;
      }

      setMessageInput('');
      loadMessages(selectedUserId);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    setIsAuthenticated(false);
    setProgramadorId('');
    setProgramadorUsername('');
    setConversaciones([]);
    setMessages([]);
    setSelectedUserId(null);
    setLoginTelefono('');
    setLoginPassword('');
  };

  // Formatear tiempo
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return formatTime(date);
    } else {
      return new Date(date).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short'
      });
    }
  };

  // Pantalla de Login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/30 bg-card/95 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Panel del Programador
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Gestión de Chat y Transmisiones
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono o Email</Label>
                <Input
                  id="telefono"
                  type="text"
                  value={loginTelefono}
                  onChange={(e) => setLoginTelefono(e.target.value)}
                  placeholder="3000000000 o programador@app.com"
                  required
                  className="bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-input-background"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-background hover:bg-primary/90"
              >
                Iniciar Sesión
              </Button>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-4">
                <p className="text-xs text-muted-foreground text-center">
                  <strong className="text-primary">Credenciales:</strong><br />
                  Teléfono: <code className="text-primary">3000000000</code><br />
                  Email: <code className="text-primary">programador@app.com</code><br />
                  Password: <code className="text-primary">123456</code>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Usuario seleccionado
  const selectedUser = conversaciones.find(c => c.userId === selectedUserId);

  // Panel Principal del Programador
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <div className="bg-card/60 backdrop-blur-xl border-b border-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="md" />
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Panel del Programador
                </h1>
                <p className="text-sm text-muted-foreground">
                  Bienvenida, {programadorUsername}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                En línea
              </Badge>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="container mx-auto p-4 h-[calc(100vh-88px)]">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Sidebar - Lista de Conversaciones */}
          <div className="col-span-3 bg-card/60 backdrop-blur-xl border border-primary/20 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-primary/10 border-b border-primary/20 p-4">
              <h2 className="font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Conversaciones ({conversaciones.length})
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversaciones.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No hay conversaciones activas</p>
                </div>
              ) : (
                conversaciones.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedUserId(conv.userId)}
                    className={`w-full p-4 border-b border-border/50 hover:bg-primary/10 transition-colors text-left ${
                      selectedUserId === conv.userId ? 'bg-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {conv.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {conv.username}
                          </p>
                          {conv.isVIP && <Gem className="w-3 h-3 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {formatDate(conv.lastMessageTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Área de Chat */}
          <div className="col-span-6 bg-card/60 backdrop-blur-xl border border-primary/20 rounded-lg overflow-hidden flex flex-col">
            {selectedUser ? (
              <>
                {/* Header del chat */}
                <div className="bg-primary/10 border-b border-primary/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold">
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold flex items-center gap-2">
                        {selectedUser.username}
                        {selectedUser.isVIP && <Gem className="w-4 h-4 text-primary" />}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Tel: {selectedUser.telefono}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={chatContainerRef}>
                  {messages.map((msg) => {
                    const isProgramador = msg.userId === programadorId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isProgramador ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`max-w-[70%] ${isProgramador ? 'bg-primary/20' : 'bg-card'} rounded-lg px-4 py-2 border ${isProgramador ? 'border-primary/30' : 'border-border/50'}`}>
                          <p className="text-xs font-bold mb-1" style={{ color: isProgramador ? '#d4af37' : '#999' }}>
                            {msg.username}
                          </p>
                          <p className="text-sm break-words">{msg.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de mensaje */}
                <div className="border-t border-primary/20 p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      className="flex-1"
                      maxLength={500}
                    />
                    <Button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="bg-primary text-background hover:bg-primary/90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-bold mb-2">Selecciona una conversación</h3>
                  <p className="text-sm text-muted-foreground">
                    Elige un usuario de la lista para ver y responder mensajes
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Panel de Configuración */}
          <div className="col-span-3 space-y-4">
            {/* Estadísticas */}
            <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Conversaciones activas</span>
                  <Badge className="bg-primary/20 text-primary">
                    {conversaciones.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Usuarios VIP</span>
                  <Badge className="bg-amber-500/20 text-amber-400">
                    {conversaciones.filter(c => c.isVIP).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Mensajes hoy</span>
                  <Badge className="bg-green-500/20 text-green-400">
                    {messages.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Transmisión */}
            <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Transmisión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Estado</span>
                  <Badge className={streamActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                    {streamActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>

                {editingStream ? (
                  <div className="space-y-2">
                    <Label className="text-xs">URL de YouTube</Label>
                    <Input
                      value={newStreamUrl}
                      onChange={(e) => setNewStreamUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setStreamUrl(newStreamUrl);
                          setStreamActive(true);
                          setEditingStream(false);
                        }}
                        className="flex-1 bg-primary text-background"
                      >
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingStream(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setEditingStream(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <Settings className="w-3 h-3 mr-2" />
                    Configurar Stream
                  </Button>
                )}

                {streamUrl && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">URL actual:</p>
                    <p className="text-xs text-primary truncate">{streamUrl}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acciones rápidas */}
            <Card className="border-primary/20 bg-card/60 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Vista Rápida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  onClick={() => window.open('/', '_blank')}
                  className="w-full"
                  variant="outline"
                >
                  Ver Landing Pública
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}