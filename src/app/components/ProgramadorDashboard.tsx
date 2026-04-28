import { useState } from 'react';
import { toast } from 'sonner';
import { Calendar, BarChart3, Plus, Clock, Timer, DollarSign, DoorOpen, XCircle, UserX, MoreVertical, MessageSquare, Menu, X, Eye, Bell, PieChart, Settings } from 'lucide-react'; // 📊 Agregado PieChart y Settings
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { TerminalChatProgramador } from '../../components/TerminalChatProgramador';
import { HabitacionesPanel } from '../../components/HabitacionesPanel';
import { ConfiguracionChatPanel } from '../../components/ConfiguracionChatPanel';
import { useAgendamientos, Agendamiento } from './AgendamientosContext';
import { useClientes } from './ClientesContext';
import { useModelos } from './ModelosContext';
import { CancelarAgendamientoModal } from '../../components/CancelarAgendamientoModal';
import { CrearAgendamientoModal } from '../../components/CrearAgendamientoModal';
import { DetalleAgendamientoModal } from '../../components/DetalleAgendamientoModal';
import { LogoIsotipo } from './LogoIsotipo';
import { SelectErrorBoundary } from '../../components/SelectErrorBoundary';
import { NotificacionesPanel } from './NotificacionesPanel';
import { AnalyticsPanel } from './AnalyticsPanel'; // 📊 Sistema de Analytics
import { ProgramadorAnalyticsPanel } from '../../components/ProgramadorAnalyticsPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface ProgramadorDashboardProps {
  accessToken: string;
  userId: string;
  userEmail: string;
  onLogout?: () => void;
}

const isDev = process.env.NODE_ENV === 'development';

export function ProgramadorDashboard({ accessToken, userId, userEmail, onLogout }: ProgramadorDashboardProps) {
  // Estados locales
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('agendamiento');
  const [formData, setFormData] = useState({
    modeloEmail: undefined as string | undefined, // ✅ FIX: undefined en lugar de ''
    clienteNombre: '',
    clienteTelefono: '',
    fecha: '',
    hora: '',
    duracionMinutos: 60,
    tipoServicio: '1 hora',
    notas: '',
  });

  const [modalCancelar, setModalCancelar] = useState<{
    isOpen: boolean;
    agendamiento: Agendamiento | null;
    tipo: 'cancelar' | 'no_show';
  }>({
    isOpen: false,
    agendamiento: null,
    tipo: 'cancelar',
  });

  // ✅ NUEVO: Modales para crear y ver detalle
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState<{
    isOpen: boolean;
    agendamiento: Agendamiento | null;
  }>({ isOpen: false, agendamiento: null });

  // Hooks de contexto con valores por defecto
  let agendamientosCtx, clientesCtx, modelosCtx, agendamientos, modelos;

  try {
    agendamientosCtx = useAgendamientos();
    clientesCtx = useClientes();
    modelosCtx = useModelos();

    // Valores seguros con fallbacks
    agendamientos = agendamientosCtx?.agendamientos || [];
    modelos = modelosCtx?.modelos || [];
  } catch (error) {
    if (isDev) console.error('❌ ERROR AL OBTENER CONTEXTOS:', error);
    throw error;
  }

  // ✅ NUEVO: Mostrar indicador de carga si los contextos no están listos
  if (!agendamientosCtx || !clientesCtx || !modelosCtx) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Validaciones
      if (!formData.modeloEmail) {
        toast.error('Por favor selecciona una modelo');
        return;
      }

      if (!formData.clienteNombre || !formData.clienteTelefono) {
        toast.error('Por favor completa los datos del cliente');
        return;
      }

      if (!formData.fecha || !formData.hora) {
        toast.error('Por favor selecciona fecha y hora');
        return;
      }

      // Verificar que los contextos existan
      if (!clientesCtx?.obtenerOCrearCliente) {
        toast.error('Error: El sistema de clientes no está disponible');
        return;
      }

      if (!agendamientosCtx?.agregarAgendamiento) {
        toast.error('Error: El sistema de agendamientos no está disponible');
        return;
      }

      // Crear o verificar cliente
      const cliente = await clientesCtx.obtenerOCrearCliente(
        formData.clienteNombre,
        formData.clienteTelefono
      );

      if (!cliente) {
        toast.error('Error al crear o encontrar el cliente');
        return;
      }

      // Buscar modelo
      const modelo = modelos.find(m => m?.email === formData.modeloEmail);

      if (!modelo) {
        toast.error('No se encontró la modelo seleccionada');
        return;
      }

      // Crear agendamiento
      await agendamientosCtx.agregarAgendamiento({
        modeloEmail: formData.modeloEmail,
        modeloNombre: modelo.nombre || modelo.nombreArtistico || 'Sin nombre',
        clienteId: cliente.id,
        clienteNombre: formData.clienteNombre,
        clienteTelefono: formData.clienteTelefono,
        fecha: formData.fecha,
        hora: formData.hora,
        duracionMinutos: Number(formData.duracionMinutos) || 60,
        tipoServicio: formData.tipoServicio,
        montoPago: 0,
        estadoPago: 'pendiente',
        estado: 'pendiente',
        notas: formData.notas || '',
        creadoPor: userEmail,
      });

      toast.success('¡Agendamiento creado exitosamente!');

      // Limpiar formulario
      setFormData({
        modeloEmail: undefined as string | undefined,
        clienteNombre: '',
        clienteTelefono: '',
        fecha: '',
        hora: '',
        duracionMinutos: 60,
        tipoServicio: '1 hora',
        notas: '',
      });
    } catch (error) {
      if (isDev) console.error('❌ ERROR EN SUBMIT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al crear el agendamiento: ${errorMessage}`);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  const handleCancelarClick = (agendamiento: Agendamiento) => {
    setModalCancelar({
      isOpen: true, 
      agendamiento, 
      tipo: 'cancelar' 
    });
  };

  const handleNoShowClick = (agendamiento: Agendamiento) => {
    setModalCancelar({
      isOpen: true, 
      agendamiento, 
      tipo: 'no_show' 
    });
  };


  return (
    <div className="min-h-screen w-full bg-background" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-premium border-b border-primary/15 shadow-premium">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <LogoIsotipo size="sm" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-primary uppercase tracking-wide truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                Dashboard Programador
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onLogout && (
              <Button 
                onClick={onLogout}
                variant="ghost"
                size="sm"
                className="hidden sm:flex border-primary/20 hover:bg-primary/10 text-red-400 hover:text-red-500"
              >
                <DoorOpen className="w-4 h-4 mr-2" />
                Salir
              </Button>
            )}
            
            <Button
              onClick={() => setMenuOpen(prev => !prev)}
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-primary/10 h-9 w-9 p-0"
            >
              {menuOpen ? <X className="w-4 h-4 text-primary" /> : <Menu className="w-4 h-4 text-primary" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="bg-card/95 backdrop-blur-md border-t border-primary/10 shadow-lg">
            <nav className="flex flex-col px-4 py-3 space-y-2 max-w-7xl mx-auto">
              <Button 
                onClick={() => handleTabChange('agendamiento')} 
                variant={activeTab === 'agendamiento' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <Calendar className="w-4 h-4 mr-3" />
                Agendamiento
              </Button>
              <Button 
                onClick={() => handleTabChange('chat')} 
                variant={activeTab === 'chat' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <MessageSquare className="w-4 h-4 mr-3" />
                Chat
              </Button>
              <Button 
                onClick={() => handleTabChange('habitaciones')} 
                variant={activeTab === 'habitaciones' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <DoorOpen className="w-4 h-4 mr-3" />
                Habitaciones
              </Button>
              <Button 
                onClick={() => handleTabChange('estadisticas')} 
                variant={activeTab === 'estadisticas' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Estadísticas
              </Button>
              <Button 
                onClick={() => handleTabChange('notificaciones')} 
                variant={activeTab === 'notificaciones' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <Bell className="w-4 h-4 mr-3" />
                Notificaciones
              </Button>
              <Button 
                onClick={() => handleTabChange('analytics')} 
                variant={activeTab === 'analytics' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <PieChart className="w-4 h-4 mr-3" />
                Analytics
              </Button>
              <Button 
                onClick={() => handleTabChange('configuracion')} 
                variant={activeTab === 'configuracion' ? 'default' : 'ghost'} 
                className="justify-start h-10 text-sm"
              >
                <Settings className="w-4 h-4 mr-3" />
                Configuración
              </Button>
              
              {onLogout && (
                <>
                  <div className="h-px bg-border my-2" />
                  <Button 
                    onClick={onLogout} 
                    variant="ghost" 
                    className="justify-start h-10 text-sm text-red-400 hover:text-red-500 hover:bg-red-950/20"
                  >
                    <DoorOpen className="w-4 h-4 mr-3" />
                    Cerrar Sesión
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="pt-24 px-3 sm:px-6 pb-12 max-w-7xl mx-auto">
        <div className="space-y-4 sm:space-y-6">
          {activeTab === 'agendamiento' && (
            <div className="space-y-4 sm:space-y-6">
              {/* ✅ BOTÓN PARA ABRIR MODAL DE CREAR AGENDAMIENTO */}
              <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardContent className="p-6">
                  <Button 
                    onClick={() => setModalCrear(true)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Nuevo Agendamiento
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                    <Calendar className="w-5 h-5" />
                    Agendamientos Activos ({agendamientos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    {agendamientos.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-muted-foreground">No hay agendamientos</p>
                      </div>
                    ) : (
                      agendamientos
                        .filter((apt) => apt && apt.id)
                        .map((apt) => (
                          <Card key={apt.id} className="border-primary/10 bg-card/50 hover:bg-card/80 transition-all">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="text-center min-w-[60px] flex-shrink-0">
                                  <div className="text-2xl font-bold text-primary leading-none">
                                    {apt.fecha ? new Date(apt.fecha).getDate() : '--'}
                                  </div>
                                  <div className="text-xs text-muted-foreground uppercase mt-1">
                                    {apt.fecha ? new Date(apt.fecha).toLocaleDateString('es', { month: 'short' }) : '--'}
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-base mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    {apt.modeloNombre || 'Sin nombre'}
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {apt.clienteNombre || 'Sin nombre'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <div className="flex items-center gap-1.5 text-muted-foreground bg-primary/5 px-2 py-1 rounded-md">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span className="text-sm font-medium">{apt.hora || '--:--'}</span>
                                    </div>
                                    {apt.duracionMinutos > 0 && (
                                      <div className="flex items-center gap-1.5 text-muted-foreground bg-primary/5 px-2 py-1 rounded-md">
                                        <Timer className="w-3.5 h-3.5" />
                                        <span className="text-sm font-medium">{apt.duracionMinutos} min</span>
                                      </div>
                                    )}
                                    {apt.tipoServicio && (
                                      <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-normal">
                                        {apt.tipoServicio}
                                      </Badge>
                                    )}
                                    {apt.montoPago > 0 && (
                                      <div className="flex items-center gap-1 text-amber-600 font-semibold ml-auto bg-amber-500/10 px-2 py-1 rounded-md">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        <span className="text-sm">{Number(apt.montoPago).toLocaleString('es-CO')}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge variant={
                                      apt.estado === 'confirmado' ? 'default' : 
                                      apt.estado === 'cancelado' ? 'destructive' : 
                                      apt.estado === 'no_show' ? 'destructive' : 
                                      'secondary'
                                    }>
                                      {apt.estado === 'confirmado' ? 'Confirmado' : 
                                       apt.estado === 'cancelado' ? 'Cancelado' : 
                                       apt.estado === 'no_show' ? 'No Show' : 
                                       'Pendiente'}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="flex gap-1">
                                  {/* ✅ BOTÓN VER DETALLE */}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => setModalDetalle({ isOpen: true, agendamiento: apt })}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  
                                  {(apt.estado === 'pendiente' || apt.estado === 'confirmado') && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => handleCancelarClick(apt)}>
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Cancelar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleNoShowClick(apt)}>
                                          <UserX className="w-4 h-4 mr-2" />
                                          Marcar No Show
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'chat' && (
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                  <MessageSquare className="w-5 h-5" />
                  Chat Terminal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="min-h-[500px]">
                  <TerminalChatProgramador userId={userId} userEmail={userEmail} />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'habitaciones' && (
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                  <DoorOpen className="w-5 h-5" />
                   Gestión de Habitaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <HabitacionesPanel />
              </CardContent>
            </Card>
          )}

          {activeTab === 'configuracion' && (
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                  <Settings className="w-5 h-5" />
                  Configuración del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ConfiguracionChatPanel />
              </CardContent>
            </Card>
          )}

          {activeTab === 'estadisticas' && (
            <ProgramadorAnalyticsPanel userEmail={userEmail} userId={userId} />
          )}

          {activeTab === 'notificaciones' && (
            <div className="space-y-4 sm:space-y-6">
              <NotificacionesPanel />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4 sm:space-y-6">
              <AnalyticsPanel />
            </div>
          )}
        </div>
      </main>

      {modalCancelar.agendamiento && (
        <CancelarAgendamientoModal
          isOpen={modalCancelar.isOpen}
          onClose={() => setModalCancelar({ isOpen: false, agendamiento: null, tipo: 'cancelar' })}
          agendamiento={modalCancelar.agendamiento}
          userEmail={userEmail}
          tipo={modalCancelar.tipo}
        />
      )}

      {modalCrear && (
        <CrearAgendamientoModal
          isOpen={modalCrear}
          onClose={() => setModalCrear(false)}
          userEmail={userEmail}
        />
      )}

      {modalDetalle.agendamiento && (
        <DetalleAgendamientoModal
          isOpen={modalDetalle.isOpen}
          onClose={() => setModalDetalle({ isOpen: false, agendamiento: null })}
          agendamiento={modalDetalle.agendamiento}
        />
      )}
    </div>
  );
}