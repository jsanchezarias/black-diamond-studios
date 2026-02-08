import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  DollarSign,
  ShoppingCart,
  MessageSquare,
  History,
  TrendingUp,
  Eye,
  Package
} from 'lucide-react';
import { Agendamiento } from '../src/app/components/AgendamientosContext';
import { useClientes } from '../src/app/components/ClientesContext';
import { useServicios } from '../src/app/components/ServiciosContext';

interface DetalleAgendamientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamiento: Agendamiento | null;
}

export function DetalleAgendamientoModal({ 
  isOpen, 
  onClose, 
  agendamiento 
}: DetalleAgendamientoModalProps) {
  const clientesCtx = useClientes();
  const serviciosCtx = useServicios();

  const [clienteDetalle, setClienteDetalle] = useState<any>(null);
  const [historialServicios, setHistorialServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && agendamiento && clientesCtx) {
      cargarDetalleCliente();
    }
  }, [isOpen, agendamiento]);

  const cargarDetalleCliente = async () => {
    if (!agendamiento || !clientesCtx) return;
    
    setLoading(true);
    try {
      // Buscar cliente por ID
      const cliente = clientesCtx.clientes.find(c => c.id === agendamiento.clienteId);
      setClienteDetalle(cliente);

      // Obtener historial de servicios del cliente
      if (serviciosCtx) {
        // ✅ CORREGIDO: Combinar servicios activos y finalizados
        const todosLosServicios = [
          ...serviciosCtx.serviciosActivos,
          ...serviciosCtx.serviciosFinalizados
        ];
        
        const serviciosCliente = todosLosServicios.filter(
          s => s.clienteId === agendamiento.clienteId
        );
        setHistorialServicios(serviciosCliente);
      }
    } catch (error) {
      console.error('Error cargando detalle del cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!agendamiento) return null;

  const estadoColor = {
    pendiente: { bg: '#3a3a1f', text: '#f4e04d', border: '#f4e04d' },
    confirmado: { bg: '#1f3a3a', text: '#4de0f4', border: '#4de0f4' },
    completado: { bg: '#2d5f2e', text: '#90ee90', border: '#90ee90' },
    cancelado: { bg: '#5f2d2d', text: '#ff6b6b', border: '#ff6b6b' },
    no_show: { bg: '#4a3a2e', text: '#ffa500', border: '#ffa500' }
  }[agendamiento.estado] || { bg: '#1a1d24', text: '#a8a6a3', border: '#a8a6a3' };

  // ✅ CORREGIDO: Calcular total desde los campos correctos de Servicio
  const totalGastado = historialServicios.reduce((sum, s) => {
    const costoTotal = (s.costoServicio || 0) + (s.costoAdicionales || 0) + (s.costoConsumo || 0);
    return sum + costoTotal;
  }, 0);
  const totalVisitas = historialServicios.filter(s => s.estado === 'finalizado').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0f1014] border-[#c9a961]/30">
        <DialogHeader>
          <DialogTitle className="text-2xl" style={{ color: '#c9a961', fontFamily: 'Playfair Display, serif' }}>
            <div className="flex items-center gap-2">
              <Eye className="w-6 h-6" />
              Detalle del Agendamiento
            </div>
          </DialogTitle>
          <DialogDescription style={{ color: '#a8a6a3' }}>
            Información completa del agendamiento y historial del cliente
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="agendamiento" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#1a1d24]">
            <TabsTrigger value="agendamiento" className="data-[state=active]:bg-[#c9a961] data-[state=active]:text-[#0f1014]">
              Agendamiento
            </TabsTrigger>
            <TabsTrigger value="cliente" className="data-[state=active]:bg-[#c9a961] data-[state=active]:text-[#0f1014]">
              Cliente
            </TabsTrigger>
            <TabsTrigger value="historial" className="data-[state=active]:bg-[#c9a961] data-[state=active]:text-[#0f1014]">
              Historial
            </TabsTrigger>
          </TabsList>

          {/* TAB: AGENDAMIENTO */}
          <TabsContent value="agendamiento" className="space-y-4">
            <Card className="bg-[#1a1d24] border-[#c9a961]/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span style={{ color: '#c9a961' }}>Información del Agendamiento</span>
                  <Badge 
                    style={{ 
                      backgroundColor: estadoColor.bg, 
                      color: estadoColor.text,
                      borderColor: estadoColor.border 
                    }}
                    className="border"
                  >
                    {agendamiento.estado.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0f1014]">
                      <User className="w-5 h-5 mt-0.5" style={{ color: '#c9a961' }} />
                      <div>
                        <p className="text-xs text-[#a8a6a3]">Modelo</p>
                        <p className="text-sm font-medium text-[#e8e6e3]">{agendamiento.modeloNombre}</p>
                        <p className="text-xs text-[#a8a6a3]">{agendamiento.modeloEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0f1014]">
                      <User className="w-5 h-5 mt-0.5" style={{ color: '#c9a961' }} />
                      <div>
                        <p className="text-xs text-[#a8a6a3]">Cliente</p>
                        <p className="text-sm font-medium text-[#e8e6e3]">{agendamiento.clienteNombre}</p>
                        <p className="text-xs text-[#a8a6a3] flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {agendamiento.clienteTelefono}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0f1014]">
                      <Calendar className="w-5 h-5 mt-0.5" style={{ color: '#c9a961' }} />
                      <div>
                        <p className="text-xs text-[#a8a6a3]">Fecha y Hora</p>
                        <p className="text-sm font-medium text-[#e8e6e3]">
                          {new Date(agendamiento.fecha).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-[#a8a6a3] flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {agendamiento.hora} - {agendamiento.duracionMinutos} minutos
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0f1014]">
                      <MapPin className="w-5 h-5 mt-0.5" style={{ color: '#c9a961' }} />
                      <div>
                        <p className="text-xs text-[#a8a6a3]">Tipo de Servicio</p>
                        <p className="text-sm font-medium text-[#e8e6e3]">
                          {agendamiento.tipoServicio === 'sede' ? '🏢 En Sede' : '🏠 A Domicilio'}
                        </p>
                      </div>
                    </div>

                    {agendamiento.notas && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0f1014]">
                        <FileText className="w-5 h-5 mt-0.5" style={{ color: '#c9a961' }} />
                        <div>
                          <p className="text-xs text-[#a8a6a3]">Notas</p>
                          <p className="text-sm text-[#e8e6e3] mt-1">{agendamiento.notas}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0f1014]">
                      <User className="w-5 h-5 mt-0.5" style={{ color: '#c9a961' }} />
                      <div>
                        <p className="text-xs text-[#a8a6a3]">Creado por</p>
                        <p className="text-sm font-medium text-[#e8e6e3]">{agendamiento.creadoPor}</p>
                        <p className="text-xs text-[#a8a6a3]">
                          {new Date(agendamiento.fechaCreacion).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {(agendamiento.estado === 'cancelado' || agendamiento.estado === 'no_show') && (
                  <>
                    <Separator className="bg-[#c9a961]/20" />
                    <div className="p-4 rounded-lg" style={{ backgroundColor: estadoColor.bg }}>
                      <p className="text-sm font-semibold mb-2" style={{ color: estadoColor.text }}>
                        {agendamiento.estado === 'cancelado' ? '❌ Cancelado' : '⚠️ No Show (No se presentó)'}
                      </p>
                      {agendamiento.motivoCancelacion && (
                        <p className="text-sm text-[#e8e6e3] mb-2">
                          <strong>Motivo:</strong> {agendamiento.motivoCancelacion}
                        </p>
                      )}
                      {agendamiento.canceladoPor && (
                        <p className="text-xs text-[#a8a6a3]">
                          Por: {agendamiento.canceladoPor} - {agendamiento.fechaCancelacion && new Date(agendamiento.fechaCancelacion).toLocaleString('es-ES')}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: CLIENTE */}
          <TabsContent value="cliente" className="space-y-4">
            <Card className="bg-[#1a1d24] border-[#c9a961]/30">
              <CardHeader>
                <CardTitle style={{ color: '#c9a961' }}>Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-[#a8a6a3] py-8">Cargando información...</p>
                ) : clienteDetalle ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-[#0f1014] text-center">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: '#c9a961' }} />
                        <p className="text-2xl font-bold" style={{ color: '#c9a961' }}>
                          {totalVisitas}
                        </p>
                        <p className="text-xs text-[#a8a6a3]">Visitas Completadas</p>
                      </div>

                      <div className="p-4 rounded-lg bg-[#0f1014] text-center">
                        <DollarSign className="w-8 h-8 mx-auto mb-2" style={{ color: '#c9a961' }} />
                        <p className="text-2xl font-bold" style={{ color: '#c9a961' }}>
                          ${totalGastado.toLocaleString()}
                        </p>
                        <p className="text-xs text-[#a8a6a3]">Total Gastado</p>
                      </div>

                      <div className="p-4 rounded-lg bg-[#0f1014] text-center">
                        <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: '#c9a961' }} />
                        <p className="text-2xl font-bold" style={{ color: '#c9a961' }}>
                          {new Date(clienteDetalle.fechaRegistro).toLocaleDateString('es-ES')}
                        </p>
                        <p className="text-xs text-[#a8a6a3]">Cliente desde</p>
                      </div>
                    </div>

                    <Separator className="bg-[#c9a961]/20" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#a8a6a3] mb-1">Nombre</p>
                        <p className="text-sm font-medium text-[#e8e6e3]">{clienteDetalle.nombre}</p>
                      </div>

                      <div>
                        <p className="text-xs text-[#a8a6a3] mb-1">Teléfono</p>
                        <p className="text-sm font-medium text-[#e8e6e3] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {clienteDetalle.telefono}
                        </p>
                      </div>

                      {clienteDetalle.email && (
                        <div>
                          <p className="text-xs text-[#a8a6a3] mb-1">Email</p>
                          <p className="text-sm font-medium text-[#e8e6e3]">{clienteDetalle.email}</p>
                        </div>
                      )}

                      {clienteDetalle.direccion && (
                        <div>
                          <p className="text-xs text-[#a8a6a3] mb-1">Dirección</p>
                          <p className="text-sm font-medium text-[#e8e6e3]">{clienteDetalle.direccion}</p>
                        </div>
                      )}
                    </div>

                    {clienteDetalle.notas && (
                      <>
                        <Separator className="bg-[#c9a961]/20" />
                        <div>
                          <p className="text-xs text-[#a8a6a3] mb-2 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Notas y Observaciones
                          </p>
                          <div className="p-3 rounded-lg bg-[#0f1014]">
                            <p className="text-sm text-[#e8e6e3]">{clienteDetalle.notas}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-[#a8a6a3] py-8">No se encontró información del cliente</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: HISTORIAL */}
          <TabsContent value="historial" className="space-y-4">
            <Card className="bg-[#1a1d24] border-[#c9a961]/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: '#c9a961' }}>
                  <History className="w-5 h-5" />
                  Historial de Servicios
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-[#a8a6a3] py-8">Cargando historial...</p>
                ) : historialServicios.length > 0 ? (
                  <div className="space-y-3">
                    {historialServicios.map((servicio) => (
                      <div 
                        key={servicio.id} 
                        className="p-4 rounded-lg bg-[#0f1014] border border-[#c9a961]/10 hover:border-[#c9a961]/30 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-[#e8e6e3]">
                              {servicio.modeloNombre}
                            </p>
                            <p className="text-xs text-[#a8a6a3]">
                              {new Date(servicio.horaInicio).toLocaleString('es-ES')}
                            </p>
                          </div>
                          <Badge 
                            style={{ 
                              backgroundColor: servicio.estado === 'finalizado' ? '#2d5f2e' : '#3a3a1f',
                              color: servicio.estado === 'finalizado' ? '#90ee90' : '#f4e04d'
                            }}
                          >
                            {servicio.estado}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-[#a8a6a3]">Tipo</p>
                            <p className="text-[#e8e6e3] font-medium">
                              {servicio.tipoServicio === 'Sede' ? '🏢 Sede' : '🏠 Domicilio'}
                            </p>
                          </div>

                          <div>
                            <p className="text-[#a8a6a3]">Duración</p>
                            <p className="text-[#e8e6e3] font-medium">{servicio.tiempoServicio}</p>
                          </div>

                          <div>
                            <p className="text-[#a8a6a3]">Total</p>
                            <p className="text-[#e8e6e3] font-medium">
                              ${((servicio.costoServicio || 0) + (servicio.costoAdicionales || 0) + (servicio.costoConsumo || 0)).toLocaleString()}
                            </p>
                          </div>

                          {servicio.habitacion && (
                            <div>
                              <p className="text-[#a8a6a3]">Habitación</p>
                              <p className="text-[#e8e6e3] font-medium">{servicio.habitacion}</p>
                            </div>
                          )}
                        </div>

                        {/* Mostrar adicionales si existen */}
                        {servicio.adicionales && servicio.adicionales.trim() && (
                          <div className="mt-3 pt-3 border-t border-[#c9a961]/10">
                            <p className="text-xs text-[#a8a6a3] mb-1">Adicionales</p>
                            <p className="text-xs text-[#e8e6e3]">{servicio.adicionales}</p>
                            <p className="text-xs font-medium mt-1" style={{ color: '#c9a961' }}>
                              ${servicio.costoAdicionales?.toLocaleString()}
                            </p>
                          </div>
                        )}

                        {/* Mostrar consumo si existe */}
                        {servicio.consumo && servicio.consumo.trim() && (
                          <div className="mt-3 pt-3 border-t border-[#c9a961]/10">
                            <p className="text-xs text-[#a8a6a3] mb-1 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              Consumo
                            </p>
                            <p className="text-xs text-[#e8e6e3]">{servicio.consumo}</p>
                            <p className="text-xs font-medium mt-1" style={{ color: '#c9a961' }}>
                              ${servicio.costoConsumo?.toLocaleString()}
                            </p>
                          </div>
                        )}

                        {/* Mostrar notas si existen */}
                        {(servicio.notasServicio || servicio.notasCierre) && (
                          <div className="mt-3 pt-3 border-t border-[#c9a961]/10">
                            <p className="text-xs text-[#a8a6a3] mb-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Observaciones
                            </p>
                            {servicio.notasServicio && (
                              <p className="text-xs text-[#e8e6e3] mb-1">{servicio.notasServicio}</p>
                            )}
                            {servicio.notasCierre && (
                              <p className="text-xs text-[#e8e6e3]">{servicio.notasCierre}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 mx-auto mb-3" style={{ color: '#c9a961', opacity: 0.3 }} />
                    <p className="text-[#a8a6a3]">No hay servicios registrados para este cliente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t border-[#c9a961]/20">
          <Button 
            onClick={onClose}
            className="bg-[#c9a961] text-[#0f1014] hover:bg-[#b8974e]"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}