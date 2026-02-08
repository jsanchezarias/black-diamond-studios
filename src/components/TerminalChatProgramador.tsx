import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Send, Users, MessageSquare, Gem, Phone, Clock, Archive, Search, User, Image as ImageIcon, Loader2, ChevronLeft, Circle } from 'lucide-react';
import { supabase } from '../src/utils/supabase/info'; // ✅ Corregido: ruta correcta
import { useClientes } from '../src/app/components/ClientesContext';
import { ScrollArea } from './ui/scroll-area';

interface Mensaje {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  mensaje: string;
  created_at: string;
  telefono_cliente: string;
  image_url?: string;
  clientes: {
    nombre: string;
  };
}

interface Conversacion {
  clienteId: string;
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
  const clientesContext = useClientes();
  const clientes = clientesContext?.clientes ?? [];
  const buscarPorTelefono = clientesContext?.buscarPorTelefono ?? (() => null);
  
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [conversacionActiva, setConversacionActiva] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [programadorChatId, setProgramadorChatId] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activas' | 'cerradas'>('activas');
  const [busqueda, setBusqueda] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [vistaMovil, setVistaMovil] = useState<'lista' | 'chat'>('lista');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      const conversacionesMap = new Map<string, Conversacion>();

      mensajesData?.forEach((msg: any) => {
        let clienteId = '';
        let clienteNombre = '';
        let clienteTelefono = '';

        if (msg.sender?.email !== userEmail) {
          clienteId = msg.sender_id;
          clienteNombre = msg.sender?.nombre || 'Cliente';
          clienteTelefono = msg.sender?.telefono || '';
        } else if (msg.receiver?.email !== userEmail) {
          clienteId = msg.receiver_id;
          clienteNombre = msg.receiver?.nombre || 'Cliente';
          clienteTelefono = msg.receiver?.telefono || '';
        } else {
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
          
          if (msg.sender_id !== programadorChatId && !msg.is_read) {
            conv.mensajesNoLeidos++;
          }
          
          if (new Date(msg.created_at) > new Date(conv.ultimoMensajeFecha)) {
            conv.ultimoMensaje = msg.message;
            conv.ultimoMensajeFecha = msg.created_at;
          }
        }
      });

      let conversacionesArray = Array.from(conversacionesMap.values());

      if (filtroEstado === 'activas') {
        conversacionesArray = conversacionesArray.filter(c => c.estado === 'activa');
      } else if (filtroEstado === 'cerradas') {
        conversacionesArray = conversacionesArray.filter(c => c.estado === 'cerrada');
      }

      conversacionesArray.sort((a, b) => 
        new Date(b.ultimoMensajeFecha).getTime() - new Date(a.ultimoMensajeFecha).getTime()
      );

      setConversaciones(conversacionesArray);
    } catch (err) {
      console.error('❌ Error completo cargando conversaciones:', err);
    }
  };

  const loadMensajesConversacion = async (clienteId: string) => {
    try {
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

      const mensajesAdaptados = data?.map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        mensaje: msg.message,
        created_at: msg.created_at,
        telefono_cliente: '',
        clientes: {
          nombre: msg.sender?.nombre || 'Usuario'
        }
      })) || [];

      setMensajes(mensajesAdaptados);
      
      if (programadorChatId && data && data.length > 0) {
        const mensajesNoLeidos = data.filter((msg: any) => 
          msg.sender_id === clienteId && !msg.is_read
        );
        
        if (mensajesNoLeidos.length > 0) {
          await supabase
            .from('chat_mensajes_publicos')
            .update({ is_read: true })
            .in('id', mensajesNoLeidos.map((m: any) => m.id));
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversacionActiva || !programadorChatId) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('make-9dadc017-chat-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error subiendo imagen:', uploadError);
        alert('Error al subir la imagen');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('make-9dadc017-chat-images')
        .getPublicUrl(filePath);

      const { error: messageError } = await supabase
        .from('chat_mensajes_publicos')
        .insert({
          sender_id: programadorChatId,
          receiver_id: conversacionActiva,
          message: `📷 Imagen: ${urlData.publicUrl}`,
          is_read: false,
          role: 'programador',
          color: '#d4af37'
        });

      if (messageError) {
        console.error('Error enviando mensaje con imagen:', messageError);
        alert('Error al enviar la imagen');
        return;
      }

      await loadMensajesConversacion(conversacionActiva);
      await loadConversaciones();
    } catch (err) {
      console.error('Error completo:', err);
      alert('Error al procesar la imagen');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !conversacionActiva || !programadorChatId) return;

    try {
      const { error } = await supabase
        .from('chat_mensajes_publicos')
        .insert({
          sender_id: programadorChatId,
          receiver_id: conversacionActiva,
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

      setMessageInput('');
      await loadMensajesConversacion(conversacionActiva);
      await loadConversaciones();
    } catch (err) {
      console.error('❌ Error completo:', err);
      alert('Error al enviar mensaje');
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
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
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
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center">
            <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-primary/40 mx-auto mb-3 sm:mb-4 animate-pulse" strokeWidth={1.5} />
            <p className="text-muted-foreground text-xs sm:text-sm font-light">Cargando terminal de chat...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)] lg:h-[calc(100vh-180px)] flex flex-col w-full max-w-full overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <Card className="border-primary/20 shadow-sm flex-1 flex flex-col min-h-0 max-w-full overflow-hidden">
        <CardHeader className="border-b border-border/50 px-3 py-2.5 sm:px-4 sm:py-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-medium tracking-normal truncate">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary/60 flex-shrink-0" strokeWidth={2} />
              <span className="truncate">Terminal de Chat</span>
            </CardTitle>
            <Badge className="bg-primary/10 text-primary border-primary/20 font-medium text-xs flex-shrink-0">
              {conversaciones.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 min-h-0 max-w-full overflow-hidden">
          <div className="h-full w-full max-w-full flex flex-col lg:flex-row overflow-hidden">
            {/* LISTA DE CONVERSACIONES */}
            <div 
              data-chat-container
              className={`
              ${vistaMovil === 'chat' ? 'hidden lg:flex' : 'flex'} 
              w-full lg:w-1/3 xl:w-1/4 
              max-w-full
              min-w-0
              flex-shrink-0
              h-full 
              border-r border-border/50 
              flex-col 
              overflow-hidden 
              bg-background
            `}
            style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}
            >
              {/* Filtros y búsqueda */}
              <div className="flex-shrink-0 px-1 sm:px-2 py-2 space-y-2 border-b border-border/30 w-full max-w-full box-border overflow-hidden" style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
                {/* Filtros */}
                <div className="flex gap-1 w-full max-w-full min-w-0 box-border overflow-hidden" style={{ minWidth: 0, maxWidth: '100%' }}>
                  <Button
                    size="sm"
                    variant={filtroEstado === 'activas' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('activas')}
                    className="flex-1 min-w-0 !shrink text-[10px] sm:text-xs h-7 sm:h-8 px-1 sm:px-2 font-light"
                    style={{ minWidth: '0 !important', flexShrink: 1 }}
                  >
                    Activas
                  </Button>
                  <Button
                    size="sm"
                    variant={filtroEstado === 'cerradas' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('cerradas')}
                    className="flex-1 min-w-0 !shrink text-[10px] sm:text-xs h-7 sm:h-8 px-0.5 sm:px-2 font-light"
                    style={{ minWidth: '0 !important', flexShrink: 1 }}
                  >
                    <Archive className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1 flex-shrink-0" strokeWidth={1.5} />
                    <span className="hidden sm:inline truncate">Cerradas</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={filtroEstado === 'todas' ? 'default' : 'outline'}
                    onClick={() => setFiltroEstado('todas')}
                    className="flex-1 min-w-0 !shrink text-[10px] sm:text-xs h-7 sm:h-8 px-1 sm:px-2 font-light"
                    style={{ minWidth: '0 !important', flexShrink: 1 }}
                  >
                    Todas
                  </Button>
                </div>

                {/* Búsqueda */}
                <div className="relative w-full max-w-full" style={{ minWidth: 0 }}>
                  <Search className="absolute left-2 top-2 sm:top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground/60 pointer-events-none" strokeWidth={1.5} />
                  <Input
                    placeholder="Buscar..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-7 sm:pl-8 pr-2 text-xs sm:text-sm h-7 sm:h-9 font-light w-full"
                    style={{ minWidth: 0 }}
                  />
                </div>
              </div>

              {/* Lista de conversaciones */}
              <ScrollArea className="flex-1 min-h-0 w-full max-w-full overflow-x-hidden" style={{ minWidth: 0, maxWidth: '100vw' }}>
                <div 
                  data-chat-list="v2-fixed"
                  className="space-y-1 px-1 sm:px-2 py-2 w-full max-w-full box-border overflow-x-hidden" 
                  style={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}
                >
                  {conversacionesFiltradas.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-2">
                      <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/20 mx-auto mb-2 sm:mb-3" strokeWidth={1} />
                      <p className="text-xs sm:text-sm text-muted-foreground font-light">
                        {busqueda ? 'No se encontraron' : 'No hay conversaciones'}
                      </p>
                    </div>
                  ) : (
                    conversacionesFiltradas.map((conv) => {
                      const tieneNoLeidos = conv.mensajesNoLeidos > 0;
                      return (
                        <div
                          key={conv.clienteId}
                          data-conversation-card
                          onClick={() => {
                            setConversacionActiva(conv.clienteId);
                            setVistaMovil('chat');
                          }}
                          className={`
                            w-full
                            p-1 sm:p-1.5 
                            rounded-lg 
                            cursor-pointer 
                            transition-all 
                            border 
                            ${conversacionActiva === conv.clienteId
                              ? 'bg-primary/10 border-primary/30 shadow-sm'
                              : tieneNoLeidos
                              ? 'bg-primary/5 border-primary/20 hover:border-primary/30'
                              : 'bg-muted/20 border-transparent hover:border-primary/20'
                            }
                          `}
                          style={{ 
                            minWidth: 0, 
                            maxWidth: '100%', 
                            boxSizing: 'border-box',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Header: nombre + badges */}
                          <div className="flex items-start justify-between mb-1 gap-2 w-full max-w-full min-w-0" style={{ minWidth: 0 }}>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 max-w-full overflow-hidden" style={{ minWidth: 0 }}>
                              <div className="relative flex-shrink-0">
                                <User className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${tieneNoLeidos ? 'text-primary' : 'text-muted-foreground/60'}`} strokeWidth={1.5} />
                                {tieneNoLeidos && (
                                  <Circle className="w-1.5 h-1.5 text-primary fill-primary absolute -top-0.5 -right-0.5" strokeWidth={0} />
                                )}
                              </div>
                              <span 
                                className={`font-light text-xs sm:text-sm truncate ${tieneNoLeidos ? 'font-normal' : 'text-foreground/80'}`} 
                                style={{ 
                                  minWidth: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                  maxWidth: '100%'
                                }}
                              >
                                {conv.clienteNombre}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {tieneNoLeidos > 0 && (
                                <Badge className="bg-primary/90 text-primary-foreground text-[9px] sm:text-[10px] px-1 sm:px-1.5 min-w-[16px] sm:min-w-[18px] h-3.5 sm:h-4 flex items-center justify-center font-light">
                                  {conv.mensajesNoLeidos}
                                </Badge>
                              )}
                              {conv.estado === 'cerrada' && (
                                <Badge variant="outline" className="text-[8px] sm:text-[9px] px-0.5 sm:px-1 border-muted-foreground/20">
                                  <Archive className="w-1.5 h-1.5 sm:w-2 sm:h-2" strokeWidth={1.5} />
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Teléfono */}
                          <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 w-full max-w-full min-w-0 overflow-hidden" style={{ minWidth: 0 }}>
                            <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 text-muted-foreground/60" strokeWidth={1.5} />
                            <span className="text-[10px] sm:text-[11px] truncate font-light text-muted-foreground/60" style={{ minWidth: 0 }}>{conv.telefono}</span>
                          </div>

                          {/* Último mensaje */}
                          <p 
                            className={`text-[10px] sm:text-xs truncate font-light w-full max-w-full block ${tieneNoLeidos ? 'text-foreground/90 font-normal' : 'text-muted-foreground/70'}`} 
                            style={{ 
                              minWidth: 0,
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              wordBreak: 'break-all'
                            }}
                          >
                            {conv.ultimoMensaje}
                          </p>

                          {/* Footer: tiempo + total mensajes */}
                          <div className="flex items-center justify-between mt-1 sm:mt-2 gap-2 w-full max-w-full min-w-0" style={{ minWidth: 0 }}>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground/60 flex items-center gap-0.5 sm:gap-1 truncate font-light min-w-0 max-w-full overflow-hidden" style={{ minWidth: 0 }}>
                              <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0" strokeWidth={1.5} />
                              <span className="truncate" style={{ minWidth: 0 }}>{formatTime(conv.ultimoMensajeFecha)}</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground/50 whitespace-nowrap flex-shrink-0 font-light">
                              {conv.totalMensajes}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* CHAT ACTIVO */}
            <div className={`
              ${vistaMovil === 'lista' ? 'hidden lg:flex' : 'flex'} 
              w-full lg:w-2/3 xl:w-3/4 
              flex-shrink-0
              h-full 
              flex-col 
              overflow-hidden 
              bg-background
            `}>
              {!conversacionActiva ? (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/20 mx-auto mb-3 sm:mb-4" strokeWidth={1} />
                    <p className="text-muted-foreground font-light text-xs sm:text-sm">
                      Selecciona una conversación
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header del chat */}
                  <div className="flex-shrink-0 px-2 sm:px-4 py-2 sm:py-3 border-b border-border/50">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Botón volver móvil */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setVistaMovil('lista')}
                        className="lg:hidden flex-shrink-0 h-8 w-8 hover:bg-primary/10"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <h3 className="font-light text-sm sm:text-base lg:text-lg truncate tracking-wide">
                            {getClienteInfo(conversacionActiva).nombre}
                          </h3>
                          <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0 font-light border-primary/20 hidden sm:flex">
                            <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" strokeWidth={1.5} />
                            <span className="hidden md:inline">{conversacionActiva}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1 flex-wrap">
                          <span className="text-[10px] sm:text-xs text-muted-foreground/70 font-light whitespace-nowrap">
                            {getClienteInfo(conversacionActiva).totalServicios} servicios
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground/70 font-light whitespace-nowrap">
                            ${(getClienteInfo(conversacionActiva).totalGastado / 1000).toFixed(0)}k
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mensajes */}
                  <div className="flex-1 overflow-hidden bg-background min-h-0">
                    <ScrollArea className="h-full px-2 sm:px-4 py-2 sm:py-4">
                      <div className="space-y-2 sm:space-y-3">
                        {mensajes.map((msg) => {
                          const isProgramador = msg.clientes?.nombre === 'Black Diamond' || msg.clientes?.nombre === 'Programadora Black Diamond';
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isProgramador ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`
                                  max-w-[90%] sm:max-w-[85%] lg:max-w-[75%] xl:max-w-[70%]
                                  p-2 sm:p-3 
                                  rounded-xl 
                                  break-words 
                                  shadow-sm 
                                  relative 
                                  overflow-hidden
                                  ${isProgramador
                                    ? 'border border-primary/20 bg-background'
                                    : 'bg-muted/50 border border-border/30'
                                  }
                                `}
                              >
                                {isProgramador && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-amber-400/15 -z-10" />
                                )}
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap relative z-10">
                                  <span className="text-[10px] sm:text-xs font-light tracking-wide">
                                    {msg.clientes?.nombre || 'Usuario'}
                                  </span>
                                  {isProgramador && (
                                    <Gem className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary/70" strokeWidth={1.5} />
                                  )}
                                  <span className="text-[9px] sm:text-[10px] text-muted-foreground/60 font-light">
                                    {new Date(msg.created_at).toLocaleTimeString('es-CO', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                {msg.mensaje && (
                                  <p className="text-xs sm:text-sm break-words whitespace-pre-wrap font-light leading-relaxed relative z-10">
                                    {msg.mensaje}
                                  </p>
                                )}
                                {msg.image_url && (
                                  <div className="mt-1.5 sm:mt-2 relative z-10">
                                    <img
                                      src={msg.image_url}
                                      alt="Mensaje adjunto"
                                      className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(msg.image_url, '_blank')}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Input de mensaje */}
                  <form onSubmit={handleSendMessage} className="flex-shrink-0 px-2 sm:px-4 py-2 sm:py-3 border-t border-border/50">
                    <div className="flex gap-1.5 sm:gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="border-primary/20 hover:bg-primary/10 hover:border-primary/40 flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                      >
                        {uploadingImage ? (
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-primary" strokeWidth={1.5} />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary/70" strokeWidth={1.5} />
                        )}
                      </Button>
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-background text-xs sm:text-sm h-8 sm:h-9 font-light border-primary/20 focus:border-primary/40"
                        maxLength={500}
                      />
                      <Button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="bg-primary/90 text-background hover:bg-primary flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 p-0"
                      >
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                    <p className="text-[9px] sm:text-xs text-muted-foreground/60 mt-1 sm:mt-2 hidden md:block font-light">
                      Respondiendo como Black Diamond
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