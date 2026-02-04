import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Send, Users, MessageSquare, Gem, Phone, Clock, X, Archive, Search, User, History } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useClientes } from '../src/app/components/ClientesContext';
import { ScrollArea } from './ui/scroll-area';

interface Mensaje {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  mensaje: string;
  created_at: string;
  telefono_cliente: string;
  clientes: {
    nombre: string;
  };
}

interface Conversacion {
  clienteId: string; // 🆕 ID del cliente en lugar de teléfono
  telefono: string;
  clienteNombre: string;
  ultimoMensaje: string;
  ultimoMensajeFecha: string;
  mensajesNoLeidos: number;
  estado: 'activa' | 'cerrada';
  totalMensajes: number;
}

interface TerminalChatProgramadorProps {
  userId: string;
  userEmail: string;
}

export function TerminalChatProgramador({ userId, userEmail }: TerminalChatProgramadorProps) {
  const { clientes, buscarPorTelefono, obtenerOCrearCliente } = useClientes();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [conversacionActiva, setConversacionActiva] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [programadorChatId, setProgramadorChatId] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activas' | 'cerradas'>('activas');
  const [busqueda, setBusqueda] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  useEffect(() => {
    initProgramador();
  }, []);

  useEffect(() => {
    if (programadorChatId) {
      loadConversaciones();
      subscribeToMessages();
    }
  }, [programadorChatId, filtroEstado]);

  useEffect(() => {
    if (conversacionActiva && programadorChatId) {
      loadMensajesConversacion(conversacionActiva);
    }
  }, [conversacionActiva]);

  const initProgramador = async () => {
    try {
      // Verificar/crear usuario programador
      const { data: existingUser } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (existingUser) {
        setProgramadorChatId(existingUser.id);
      } else {
        const { data: newUser, error } = await supabase
          .from('clientes')
          .insert({
            nombre: 'Black Diamond',
            email: userEmail,
            telefono: '3000000000',
            total_servicios: 0,
            total_gastado: 0
          })
          .select()
          .single();

        if (!error && newUser) {
          setProgramadorChatId(newUser.id);
        }
      }
    } catch (err) {
      console.error('Error inicializando programador:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversaciones = async () => {
    try {
      console.log('🔍 Cargando conversaciones...');
      
      // 🆕 NUEVA LÓGICA: Obtener mensajes usando sender_id y receiver_id
      const { data: mensajesData, error } = await supabase
        .from('chat_mensajes_publicos')
        .select(`
          id,
          message,
          created_at,
          sender_id,
          receiver_id,
          is_read,
          role,
          sender:sender_id(id, nombre, telefono, email),
          receiver:receiver_id(id, nombre, telefono, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando conversaciones:', error);
        return;
      }

      console.log('📨 Mensajes obtenidos:', mensajesData);

      // Agrupar mensajes por cliente (excluyendo al programador)
      const conversacionesMap = new Map<string, Conversacion>();

      mensajesData?.forEach((msg: any) => {
        // Determinar quién es el cliente (el que NO es programador)
        let clienteId = '';
        let clienteNombre = '';
        let clienteTelefono = '';
        let clienteEmail = '';

        // Si el sender NO es programador, es el cliente
        if (msg.sender?.email !== userEmail) {
          clienteId = msg.sender_id;
          clienteNombre = msg.sender?.nombre || 'Cliente';
          clienteTelefono = msg.sender?.telefono || '';
          clienteEmail = msg.sender?.email || '';
        }
        // Si el receiver NO es programador, es el cliente
        else if (msg.receiver?.email !== userEmail) {
          clienteId = msg.receiver_id;
          clienteNombre = msg.receiver?.nombre || 'Cliente';
          clienteTelefono = msg.receiver?.telefono || '';
          clienteEmail = msg.receiver?.email || '';
        }
        // Si no hay cliente identificado, saltar este mensaje
        else {
          return;
        }

        if (!conversacionesMap.has(clienteId)) {
          conversacionesMap.set(clienteId, {
            clienteId: clienteId,
            telefono: clienteTelefono,
            clienteNombre: clienteNombre,
            ultimoMensaje: msg.message,
            ultimoMensajeFecha: msg.created_at,
            mensajesNoLeidos: msg.sender_id !== programadorChatId && !msg.is_read ? 1 : 0,
            estado: 'activa',
            totalMensajes: 1
          });
        } else {
          const conv = conversacionesMap.get(clienteId)!;
          conv.totalMensajes++;
          
          // Contar mensajes no leídos
          if (msg.sender_id !== programadorChatId && !msg.is_read) {
            conv.mensajesNoLeidos++;
          }
          
          // Actualizar último mensaje si es más reciente
          if (new Date(msg.created_at) > new Date(conv.ultimoMensajeFecha)) {
            conv.ultimoMensaje = msg.message;
            conv.ultimoMensajeFecha = msg.created_at;
          }
        }
      });

      let conversacionesArray = Array.from(conversacionesMap.values());

      // Filtrar por estado
      if (filtroEstado === 'activas') {
        conversacionesArray = conversacionesArray.filter(c => c.estado === 'activa');
      } else if (filtroEstado === 'cerradas') {
        conversacionesArray = conversacionesArray.filter(c => c.estado === 'cerrada');
      }

      // Ordenar por fecha más reciente
      conversacionesArray.sort((a, b) => 
        new Date(b.ultimoMensajeFecha).getTime() - new Date(a.ultimoMensajeFecha).getTime()
      );

      console.log('✅ Conversaciones procesadas:', conversacionesArray);
      setConversaciones(conversacionesArray);
    } catch (err) {
      console.error('❌ Error completo cargando conversaciones:', err);
    }
  };

  const loadMensajesConversacion = async (clienteId: string) => {
    try {
      console.log('📨 Cargando mensajes de cliente:', clienteId);
      
      // 🆕 Obtener mensajes donde el cliente es sender O receiver
      const { data, error } = await supabase
        .from('chat_mensajes_publicos')
        .select(`
          id,
          sender_id,
          receiver_id,
          message,
          created_at,
          is_read,
          role,
          sender:sender_id(id, nombre, email),
          receiver:receiver_id(id, nombre, email)
        `)
        .or(`sender_id.eq.${clienteId},receiver_id.eq.${clienteId}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error cargando mensajes:', error);
        return;
      }

      console.log('✅ Mensajes cargados:', data);

      // Adaptar al formato esperado por el componente
      const mensajesAdaptados = data?.map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        mensaje: msg.message, // Mapear 'message' a 'mensaje'
        created_at: msg.created_at,
        telefono_cliente: '', // Campo legacy
        clientes: {
          nombre: msg.sender?.nombre || 'Usuario'
        }
      })) || [];

      setMensajes(mensajesAdaptados);
      
      // 🆕 Marcar mensajes como leídos
      if (programadorChatId && data && data.length > 0) {
        const mensajesNoLeidos = data.filter((msg: any) => 
          msg.sender_id === clienteId && !msg.is_read
        );
        
        if (mensajesNoLeidos.length > 0) {
          await supabase
            .from('chat_mensajes_publicos')
            .update({ is_read: true })
            .in('id', mensajesNoLeidos.map((m: any) => m.id));
          
          console.log(`✅ ${mensajesNoLeidos.length} mensajes marcados como leídos`);
        }
      }
    } catch (err) {
      console.error('❌ Error completo:', err);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_mensajes_publicos'
        },
        () => {
          loadConversaciones();
          if (conversacionActiva) {
            loadMensajesConversacion(conversacionActiva);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_mensajes_publicos'
        },
        () => {
          loadConversaciones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !conversacionActiva || !programadorChatId) return;

    try {
      console.log('💬 Programador enviando mensaje a cliente:', conversacionActiva);
      
      // 🆕 Enviar mensaje usando receiver_id (clienteId) en lugar de telefono_cliente
      const { error } = await supabase
        .from('chat_mensajes_publicos')
        .insert({
          sender_id: programadorChatId,
          receiver_id: conversacionActiva, // El ID del cliente, no el teléfono
          message: messageInput.trim(),
          is_read: false,
          role: 'programador',
          color: '#d4af37'
        });

      if (error) {
        console.error('❌ Error enviando mensaje:', error);
        alert('Error al enviar mensaje');
        return;
      }

      console.log('✅ Mensaje enviado exitosamente');
      setMessageInput('');
      
      // Recargar mensajes y conversaciones
      await loadMensajesConversacion(conversacionActiva);
      await loadConversaciones();
    } catch (err) {
      console.error('❌ Error completo:', err);
      alert('Error al enviar mensaje. Por favor intenta de nuevo.');
    }
  };

  const cerrarConversacion = async (telefono: string) => {
    if (!confirm('¿Cerrar esta conversación? El historial se mantendrá.')) return;

    try {
      // Actualizar todos los mensajes de esta conversación
      const { error } = await supabase
        .from('chat_mensajes_publicos')
        .update({ estado_conversacion: 'cerrada' })
        .eq('telefono_cliente', telefono);

      if (error) {
        console.error('Error cerrando conversación:', error);
        return;
      }

      await loadConversaciones();
      if (conversacionActiva === telefono) {
        setConversacionActiva(null);
      }
    } catch (err) {
      console.error('Error completo:', err);
    }
  };

  const reabrirConversacion = async (telefono: string) => {
    try {
      const { error } = await supabase
        .from('chat_mensajes_publicos')
        .update({ estado_conversacion: 'activa' })
        .eq('telefono_cliente', telefono);

      if (error) {
        console.error('Error reabriendo conversación:', error);
        return;
      }

      await loadConversaciones();
    } catch (err) {
      console.error('Error completo:', err);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  };

  const getClienteInfo = (telefono: string) => {
    const cliente = buscarPorTelefono(telefono);
    return {
      nombre: cliente?.nombre || 'Cliente',
      totalServicios: cliente?.totalServicios || 0,
      totalGastado: cliente?.totalGastado || 0,
      ultimaVisita: cliente?.ultimaVisita
    };
  };

  const conversacionesFiltradas = conversaciones.filter(c => 
    c.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono.includes(busqueda)
  );

  if (loading) {
    return (
      <Card className="border-primary/30">
        <CardContent className="p-8">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Cargando terminal de chat...</p>
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
              Terminal de Chat - Conversaciones por Cliente
            </CardTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {conversaciones.length} conversaciones
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-4 h-[600px]">
            {/* Lista de Conversaciones */}
            <div className="col-span-4 border-r border-border pr-4">
              <div className="space-y-3">
                {/* Filtros */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={filtroEstado === 'activas' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('activas')}
                    className="flex-1"
                  >
                    Activas
                  </Button>
                  <Button
                    size="sm"
                    variant={filtroEstado === 'cerradas' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('cerradas')}
                    className="flex-1"
                  >
                    <Archive className="w-3 h-3 mr-1" />
                    Cerradas
                  </Button>
                  <Button
                    size="sm"
                    variant={filtroEstado === 'todas' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('todas')}
                    className="flex-1"
                  >
                    Todas
                  </Button>
                </div>

                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o teléfono..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {/* Lista de conversaciones */}
                <ScrollArea className="h-[480px]">
                  <div className="space-y-2">
                    {conversacionesFiltradas.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          {busqueda ? 'No se encontraron conversaciones' : 'No hay conversaciones'}
                        </p>
                      </div>
                    ) : (
                      conversacionesFiltradas.map((conv) => {
                        const clienteInfo = getClienteInfo(conv.telefono);
                        return (
                          <div
                            key={conv.clienteId}
                            onClick={() => setConversacionActiva(conv.clienteId)}
                            className={`p-3 rounded-lg cursor-pointer transition-all border ${
                              conversacionActiva === conv.clienteId
                                ? 'bg-primary/10 border-primary/50'
                                : 'bg-muted/30 border-transparent hover:border-primary/30'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                <span className="font-medium text-sm">{conv.clienteNombre}</span>
                              </div>
                              {conv.estado === 'cerrada' && (
                                <Badge variant="outline" className="text-[10px] px-1">
                                  <Archive className="w-2 h-2 mr-1" />
                                  Cerrada
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <Phone className="w-3 h-3" />
                              {conv.telefono}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.ultimoMensaje}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(conv.ultimoMensajeFecha)}
                              </span>
                              <span className="text-[10px] text-primary">
                                {conv.totalMensajes} mensajes
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Chat Activo */}
            <div className="col-span-8 flex flex-col">
              {!conversacionActiva ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <p className="text-muted-foreground">
                      Selecciona una conversación para comenzar
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header de conversación */}
                  <div className="pb-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">
                            {getClienteInfo(conversacionActiva).nombre}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            <Phone className="w-3 h-3 mr-1" />
                            {conversacionActiva}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {getClienteInfo(conversacionActiva).totalServicios} servicios
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ${(getClienteInfo(conversacionActiva).totalGastado / 1000).toFixed(0)}k gastados
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {conversaciones.find(c => c.telefono === conversacionActiva)?.estado === 'activa' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cerrarConversacion(conversacionActiva)}
                            className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Cerrar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reabrirConversacion(conversacionActiva)}
                            className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                          >
                            <History className="w-4 h-4 mr-2" />
                            Reabrir
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mensajes */}
                  <ScrollArea className="flex-1 py-4">
                    <div className="space-y-3 pr-4">
                      {mensajes.map((msg) => {
                        const isProgramador = msg.clientes?.nombre === 'Black Diamond' || msg.clientes?.nombre === 'Programadora Black Diamond';
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isProgramador ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                isProgramador
                                  ? 'bg-gradient-to-r from-primary/20 to-amber-400/20 border border-primary/30'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold">
                                  {msg.clientes?.nombre || 'Usuario'}
                                </span>
                                {isProgramador && (
                                  <Gem className="w-3 h-3 text-primary" />
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(msg.created_at).toLocaleTimeString('es-CO', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-sm">{msg.mensaje}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input de mensaje */}
                  <form onSubmit={handleSendMessage} className="pt-3 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-background"
                        maxLength={500}
                        disabled={conversaciones.find(c => c.telefono === conversacionActiva)?.estado === 'cerrada'}
                      />
                      <Button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="bg-primary text-background hover:bg-primary/90"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      💬 Respondiendo como Black Diamond
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}