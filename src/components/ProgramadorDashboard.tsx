import { Calendar, BarChart3, Plus, Clock, DoorOpen, TrendingUp, XCircle, UserX, MoreVertical, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { HabitacionesPanel } from './HabitacionesPanel';
import { RendimientoModelosPanel } from './RendimientoModelosPanel';
import { TerminalChatProgramador } from './TerminalChatProgramador'; // Terminal de chat mejorada
import { useAgendamientos, Agendamiento } from '../src/app/components/AgendamientosContext';
import { useClientes } from '../src/app/components/ClientesContext';
import { useModelos } from '../src/app/components/ModelosContext';
import { CancelarAgendamientoModal } from './CancelarAgendamientoModal';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface ProgramadorDashboardProps {
  accessToken: string;
  userId: string;
  userEmail: string;
  onLogout?: () => void;
}

export function ProgramadorDashboard({ accessToken, userId, userEmail, onLogout }: ProgramadorDashboardProps) {
  const { agendamientos, agregarAgendamiento } = useAgendamientos();
  const { obtenerOCrearCliente } = useClientes();
  const { modelos } = useModelos();
  
  const [formData, setFormData] = useState({
    modeloEmail: '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Crear o actualizar cliente
    await obtenerOCrearCliente(formData.clienteNombre, formData.clienteTelefono);
    
    // Encontrar la modelo seleccionada
    const modelo = modelos.find(m => m.email === formData.modeloEmail);
    
    if (modelo) {
      agregarAgendamiento({
        modeloEmail: formData.modeloEmail,
        modeloNombre: modelo.nombre,
        clienteNombre: formData.clienteNombre,
        clienteTelefono: formData.clienteTelefono,
        fecha: formData.fecha,
        hora: formData.hora,
        duracionMinutos: Number(formData.duracionMinutos),
        tipoServicio: formData.tipoServicio,
        estado: 'pendiente',
        notas: formData.notas,
        creadoPor: userEmail, // En producción sería el email del usuario logueado
      });
      
      // Limpiar formulario
      setFormData({
        modeloEmail: '',
        clienteNombre: '',
        clienteTelefono: '',
        fecha: '',
        hora: '',
        duracionMinutos: 60,
        tipoServicio: '1 hora',
        notas: '',
      });
    }
  };

  const stats = {
    serviciosHoy: 12,
    serviciosSemana: 68,
    serviciosMes: 289,
    modelosActivas: 8,
    ocupacionPromedio: 75,
    ingresosDia: 1850000,
    ingresosSemana: 10200000,
    ingresosMes: 43500000,
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header con botón de logout */}
      {onLogout && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Programador Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Panel de gestión operativa</p>
          </div>
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <DoorOpen className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      )}

      <Tabs defaultValue="agendamiento" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-secondary">
          <TabsTrigger value="agendamiento">
            <Calendar className="w-4 h-4 mr-2" />
            Agendamiento
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="habitaciones">
            <DoorOpen className="w-4 h-4 mr-2" />
            Habitaciones
          </TabsTrigger>
          <TabsTrigger value="estadisticas">
            <BarChart3 className="w-4 h-4 mr-2" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agendamiento" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Crear Nuevo Agendamiento</CardTitle>
                <CardDescription>Programa un nuevo servicio</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="modelo">Modelo</Label>
                    <select 
                      id="modelo" 
                      name="modeloEmail"
                      className="w-full mt-2 px-3 py-2 bg-input-background border border-border rounded-md text-foreground"
                      value={formData.modeloEmail}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selecciona una modelo</option>
                      {modelos.map(m => (
                        <option key={m.id} value={m.email}>
                          {m.nombre} {!m.activa && '(No disponible)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="cliente">Nombre del Cliente</Label>
                    <Input 
                      id="cliente" 
                      name="clienteNombre"
                      placeholder="Ej: Carlos Mendoza" 
                      className="mt-2"
                      value={formData.clienteNombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefono">Teléfono del Cliente</Label>
                    <Input 
                      id="telefono" 
                      name="clienteTelefono"
                      placeholder="+57 310 123 4567" 
                      className="mt-2"
                      value={formData.clienteTelefono}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="servicio">Tipo de Servicio</Label>
                    <Input 
                      id="servicio" 
                      name="tipoServicio"
                      placeholder="Ej: 1 hora, rato, etc." 
                      className="mt-2"
                      value={formData.tipoServicio}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input 
                      id="fecha" 
                      name="fecha"
                      type="date" 
                      className="mt-2"
                      value={formData.fecha}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="hora">Hora</Label>
                    <Input 
                      id="hora" 
                      name="hora"
                      type="time" 
                      className="mt-2"
                      value={formData.hora}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duracion">Duración (min)</Label>
                    <Input 
                      id="duracion" 
                      name="duracionMinutos"
                      type="number" 
                      placeholder="60" 
                      className="mt-2"
                      value={formData.duracionMinutos}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notas">Notas</Label>
                    <Input 
                      id="notas" 
                      name="notas"
                      placeholder="Información adicional..."
                      className="mt-2"
                      value={formData.notas}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Agendamiento
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agendamientos Programados</CardTitle>
              <CardDescription>Todos los servicios agendados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agendamientos.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay agendamientos programados</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Los agendamientos que crees aparecerán aquí
                    </p>
                  </div>
                ) : (
                  agendamientos.map((apt) => (
                    <div 
                      key={apt.id}
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-2xl font-bold text-primary">
                            {new Date(apt.fecha).getDate()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(apt.fecha).toLocaleDateString('es', { month: 'short' })}
                          </div>
                        </div>
                        <div className="h-12 w-px bg-border"></div>
                        <div>
                          <p className="font-medium">{apt.modeloNombre}</p>
                          <p className="text-sm text-muted-foreground">{apt.clienteNombre}</p>
                          <p className="text-xs text-muted-foreground">{apt.clienteTelefono}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{apt.hora}</span>
                        </div>
                        <Badge 
                          variant={
                            apt.estado === 'confirmado' ? 'default' :
                            apt.estado === 'cancelado' ? 'destructive' :
                            apt.estado === 'no_show' ? 'destructive' :
                            'secondary'
                          }
                          className={
                            apt.estado === 'confirmado' ? 'bg-primary/20 text-primary border-primary/30' :
                            apt.estado === 'cancelado' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' :
                            apt.estado === 'no_show' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                            ''
                          }
                        >
                          {apt.estado === 'confirmado' ? 'Confirmado' : 
                           apt.estado === 'cancelado' ? 'Cancelado' :
                           apt.estado === 'no_show' ? 'No Show' :
                           'Pendiente'}
                        </Badge>
                        {(apt.estado === 'pendiente' || apt.estado === 'confirmado') && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                              <DropdownMenuItem
                                onClick={() =>
                                  setModalCancelar({
                                    isOpen: true,
                                    agendamiento: apt,
                                    tipo: 'cancelar',
                                  })
                                }
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setModalCancelar({
                                    isOpen: true,
                                    agendamiento: apt,
                                    tipo: 'no_show',
                                  })
                                }
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                No Show
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <TerminalChatProgramador userId={userId} userEmail={userEmail} />
        </TabsContent>

        <TabsContent value="habitaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Habitaciones</CardTitle>
              <CardDescription>Disponibilidad en tiempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <HabitacionesPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card key="stat-servicios-hoy" className="border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Servicios Hoy</CardDescription>
                <CardTitle className="text-3xl text-primary">{stats.serviciosHoy}</CardTitle>
              </CardHeader>
            </Card>
            <Card key="stat-servicios-semana" className="border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Servicios Semana</CardDescription>
                <CardTitle className="text-3xl text-primary">{stats.serviciosSemana}</CardTitle>
              </CardHeader>
            </Card>
            <Card key="stat-servicios-mes" className="border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Servicios Mes</CardDescription>
                <CardTitle className="text-3xl text-primary">{stats.serviciosMes}</CardTitle>
              </CardHeader>
            </Card>
            <Card key="stat-modelos-activas" className="border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription>Modelos Activas</CardDescription>
                <CardTitle className="text-3xl text-primary">{stats.modelosActivas}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card key="ingreso-dia" className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardDescription>Ingresos Hoy</CardDescription>
                <CardTitle className="text-2xl text-primary">
                  ${(stats.ingresosDia / 1000000).toFixed(1)}M
                </CardTitle>
              </CardHeader>
            </Card>
            <Card key="ingreso-semana" className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardDescription>Ingresos Semana</CardDescription>
                <CardTitle className="text-2xl text-primary">
                  ${(stats.ingresosSemana / 1000000).toFixed(1)}M
                </CardTitle>
              </CardHeader>
            </Card>
            <Card key="ingreso-mes" className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardDescription>Ingresos Mes</CardDescription>
                <CardTitle className="text-2xl text-primary">
                  ${(stats.ingresosMes / 1000000).toFixed(1)}M
                </CardTitle>
              </CardHeader>
            </Card>
            <Card key="ocupacion-promedio" className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardDescription>Ocupación Promedio</CardDescription>
                <CardTitle className="text-2xl text-primary">{stats.ocupacionPromedio}%</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <RendimientoModelosPanel />
        </TabsContent>
      </Tabs>
      <CancelarAgendamientoModal
        isOpen={modalCancelar.isOpen}
        onClose={() => setModalCancelar({ isOpen: false, agendamiento: null, tipo: 'cancelar' })}
        agendamiento={modalCancelar.agendamiento}
        userEmail="programador@app.com"
        tipo={modalCancelar.tipo}
      />
    </div>
  );
}