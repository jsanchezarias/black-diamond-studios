import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  DollarSign,
  User,
  List,
  Filter,
  TrendingUp,
  History
} from 'lucide-react';
import { useServicios, Servicio } from '../src/app/components/ServiciosContext';
import { useModelos } from '../src/app/components/ModelosContext';
import { useClientes } from '../src/app/components/ClientesContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ClienteInfoModal } from './ClienteInfoModal';
import { ServicioDetalleCard } from './ServicioDetalleCard';

type VistaCalendario = 'dia' | 'semana' | 'mes' | 'lista';
type FiltroTiempo = 'todos' | 'proximos' | 'pasados';

interface CalendarioPanelProps {
  modeloEmail?: string; // Si se pasa, filtra solo servicios de esa modelo
  userRole?: 'owner' | 'admin' | 'programador' | 'modelo'; // Rol del usuario para determinar acceso a info de clientes
}

export function CalendarioPanel({ modeloEmail, userRole = 'modelo' }: CalendarioPanelProps) {
  const { serviciosActivos, serviciosFinalizados } = useServicios();
  const { modelos } = useModelos();
  const { buscarPorTelefono } = useClientes();
  const [vista, setVista] = useState<VistaCalendario>('mes');
  const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>('todos');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);
  const [clienteTelefonoSeleccionado, setClienteTelefonoSeleccionado] = useState<string | null>(null);

  // Función para obtener el nombre artístico de la modelo
  const obtenerNombreArtistico = (servicioModeloEmail: string, nombrePorDefecto: string) => {
    const modelo = modelos.find(m => m.email === servicioModeloEmail);
    return modelo?.nombreArtistico || nombrePorDefecto;
  };

  // Función para obtener el nombre de usuario del cliente
  const obtenerNombreUsuarioCliente = (telefono?: string) => {
    if (!telefono) return null;
    const cliente = buscarPorTelefono(telefono);
    return cliente?.nombreUsuario || null;
  };

  // Determinar si el usuario tiene acceso a la info del cliente (owner, admin, programador)
  const puedeVerInfoCliente = userRole === 'owner' || userRole === 'admin' || userRole === 'programador';

  // Combinar todos los servicios
  const todosLosServicios = useMemo(() => {
    const servicios = [...serviciosActivos, ...serviciosFinalizados];
    // Filtrar por modelo si se especifica
    return modeloEmail 
      ? servicios.filter(s => s.modeloEmail === modeloEmail)
      : servicios;
  }, [serviciosActivos, serviciosFinalizados, modeloEmail]);

  // Navegación
  const navegarAnterior = () => {
    const nuevaFecha = new Date(fechaActual);
    if (vista === 'dia') {
      nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    } else if (vista === 'semana') {
      nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    } else {
      nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
    }
    setFechaActual(nuevaFecha);
  };

  const navegarSiguiente = () => {
    const nuevaFecha = new Date(fechaActual);
    if (vista === 'dia') {
      nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    } else if (vista === 'semana') {
      nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    } else {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
    }
    setFechaActual(nuevaFecha);
  };

  const irHoy = () => {
    setFechaActual(new Date());
  };

  // Obtener texto del periodo
  const obtenerTextoPeriodo = () => {
    if (vista === 'dia') {
      return fechaActual.toLocaleDateString('es-CO', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (vista === 'semana') {
      const inicio = obtenerInicioSemana(fechaActual);
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 6);
      return `${inicio.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} - ${fin.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return fechaActual.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
    }
  };

  // Funciones auxiliares
  const obtenerInicioSemana = (fecha: Date) => {
    const d = new Date(fecha);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes como primer día
    return new Date(d.setDate(diff));
  };

  const esMismoDia = (fecha1: Date, fecha2: Date) => {
    return fecha1.getFullYear() === fecha2.getFullYear() &&
           fecha1.getMonth() === fecha2.getMonth() &&
           fecha1.getDate() === fecha2.getDate();
  };

  const obtenerServiciosPorDia = (fecha: Date) => {
    return todosLosServicios.filter(servicio => 
      esMismoDia(servicio.horaInicio, fecha)
    );
  };

  // Renderizar vista de día
  const renderVistaDia = () => {
    const servicios = obtenerServiciosPorDia(fechaActual);

    return (
      <div className="space-y-4">
        {servicios.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay servicios registrados para este día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {servicios
              .sort((a, b) => a.horaInicio.getTime() - b.horaInicio.getTime())
              .map(servicio => (
                <Card 
                  key={servicio.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                    servicio.estado === 'activo' ? 'border-primary/30 bg-primary/5' : ''
                  }`}
                  onClick={() => setServicioSeleccionado(servicio)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-semibold">
                            {servicio.horaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            {servicio.horaFin && ` - ${servicio.horaFin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                          <Badge variant={servicio.estado === 'activo' ? 'default' : 'secondary'}>
                            {servicio.estado === 'activo' ? 'En curso' : 'Finalizado'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{obtenerNombreArtistico(servicio.modeloEmail, servicio.modeloNombre)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {servicio.tipoServicio}
                            {servicio.habitacion && ` - Hab. ${servicio.habitacion}`}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {servicio.tiempoServicio}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-primary font-semibold">
                          <DollarSign className="w-4 h-4" />
                          {(() => {
                            const costoTiemposAdicionales = (servicio.tiemposAdicionales || []).reduce((sum, t) => sum + t.costo, 0);
                            const costoAdicionalesExtra = (servicio.adicionalesExtra || []).reduce((sum, a) => sum + a.costo, 0);
                            const costoConsumosDetallados = (servicio.consumosDetallados || []).reduce((sum, c) => sum + (c.costo * c.cantidad), 0);
                            const total = servicio.costoServicio + servicio.costoAdicionales + servicio.costoConsumo + 
                                         costoTiemposAdicionales + costoAdicionalesExtra + costoConsumosDetallados;
                            return total.toLocaleString('es-CO');
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {servicio.metodoPago}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar vista de semana
  const renderVistaSemana = () => {
    const inicioSemana = obtenerInicioSemana(fechaActual);
    const dias = Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(inicioSemana);
      dia.setDate(dia.getDate() + i);
      return dia;
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {dias.map((dia, index) => {
          const servicios = obtenerServiciosPorDia(dia);
          const esHoy = esMismoDia(dia, new Date());

          return (
            <Card 
              key={index}
              className={`${esHoy ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-medium text-center">
                  {dia.toLocaleDateString('es-CO', { weekday: 'short' })}
                </CardTitle>
                <div className={`text-2xl font-bold text-center ${esHoy ? 'text-primary' : ''}`}>
                  {dia.getDate()}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {servicios.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Sin servicios
                  </p>
                ) : (
                  servicios
                    .sort((a, b) => a.horaInicio.getTime() - b.horaInicio.getTime())
                    .map(servicio => (
                      <div
                        key={servicio.id}
                        className={`text-xs p-2 rounded border cursor-pointer transition-colors hover:border-primary/50 ${
                          servicio.estado === 'activo' 
                            ? 'bg-primary/10 border-primary/30' 
                            : 'bg-secondary border-border'
                        }`}
                        onClick={() => setServicioSeleccionado(servicio)}
                      >
                        <div className="font-medium truncate">{obtenerNombreArtistico(servicio.modeloEmail, servicio.modeloNombre)}</div>
                        <div className="text-muted-foreground">
                          {servicio.horaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-primary font-semibold">
                          ${(() => {
                            const costoTiemposAdicionales = (servicio.tiemposAdicionales || []).reduce((sum, t) => sum + t.costo, 0);
                            const costoAdicionalesExtra = (servicio.adicionalesExtra || []).reduce((sum, a) => sum + a.costo, 0);
                            const costoConsumosDetallados = (servicio.consumosDetallados || []).reduce((sum, c) => sum + (c.costo * c.cantidad), 0);
                            const total = servicio.costoServicio + servicio.costoAdicionales + servicio.costoConsumo + 
                                         costoTiemposAdicionales + costoAdicionalesExtra + costoConsumosDetallados;
                            return total.toLocaleString('es-CO');
                          })()}
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Renderizar vista de mes
  const renderVistaMes = () => {
    const primerDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    const ultimoDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
    
    const diasMes: (Date | null)[] = [];
    
    // Días vacíos al inicio
    const primerDiaSemana = primerDia.getDay();
    const diasVaciosInicio = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    for (let i = 0; i < diasVaciosInicio; i++) {
      diasMes.push(null);
    }
    
    // Días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      diasMes.push(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia));
    }

    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="space-y-3">
        {/* Encabezado de días */}
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => (
            <div key={dia} className="text-center font-semibold text-sm text-muted-foreground py-2">
              {dia}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-2">
          {diasMes.map((dia, index) => {
            if (!dia) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const servicios = obtenerServiciosPorDia(dia);
            const esHoy = esMismoDia(dia, new Date());
            const totalIngresos = servicios.reduce((sum, s) => {
              const costoTiemposAdicionales = (s.tiemposAdicionales || []).reduce((sumT, t) => sumT + t.costo, 0);
              const costoAdicionalesExtra = (s.adicionalesExtra || []).reduce((sumA, a) => sumA + a.costo, 0);
              const costoConsumosDetallados = (s.consumosDetallados || []).reduce((sumC, c) => sumC + (c.costo * c.cantidad), 0);
              return sum + s.costoServicio + s.costoAdicionales + s.costoConsumo + 
                     costoTiemposAdicionales + costoAdicionalesExtra + costoConsumosDetallados;
            }, 0);

            return (
              <Card
                key={index}
                className={`aspect-square p-2 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                  esHoy ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => {
                  setFechaActual(dia);
                  setVista('dia');
                }}
              >
                <div className="h-full flex flex-col">
                  <div className={`text-sm font-semibold mb-1 ${esHoy ? 'text-primary' : ''}`}>
                    {dia.getDate()}
                  </div>
                  {servicios.length > 0 && (
                    <div className="flex-1 space-y-1">
                      <div className="text-xs text-muted-foreground">
                        {servicios.length} servicio{servicios.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-primary font-semibold">
                        ${totalIngresos.toLocaleString('es-CO')}
                      </div>
                      {/* Indicadores de servicios */}
                      <div className="flex flex-wrap gap-1">
                        {servicios.slice(0, 3).map(servicio => (
                          <div
                            key={servicio.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              servicio.estado === 'activo' ? 'bg-primary' : 'bg-muted-foreground'
                            }`}
                          />
                        ))}
                        {servicios.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{servicios.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar vista de lista
  const renderVistaLista = () => {
    const serviciosFiltrados = todosLosServicios.filter(servicio => {
      if (filtroTiempo === 'todos') return true;
      if (filtroTiempo === 'proximos') return servicio.horaInicio > new Date();
      if (filtroTiempo === 'pasados') return servicio.horaInicio < new Date();
      return true;
    });

    return (
      <div className="space-y-4">
        {serviciosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay servicios registrados para este filtro</p>
          </div>
        ) : (
          <div className="space-y-3">
            {serviciosFiltrados
              .sort((a, b) => a.horaInicio.getTime() - b.horaInicio.getTime())
              .map(servicio => (
                <Card 
                  key={servicio.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                    servicio.estado === 'activo' ? 'border-primary/30 bg-primary/5' : ''
                  }`}
                  onClick={() => setServicioSeleccionado(servicio)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-semibold">
                            {servicio.horaInicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            {servicio.horaFin && ` - ${servicio.horaFin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                          <Badge variant={servicio.estado === 'activo' ? 'default' : 'secondary'}>
                            {servicio.estado === 'activo' ? 'En curso' : 'Finalizado'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{obtenerNombreArtistico(servicio.modeloEmail, servicio.modeloNombre)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {servicio.tipoServicio}
                            {servicio.habitacion && ` - Hab. ${servicio.habitacion}`}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {servicio.tiempoServicio}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-primary font-semibold">
                          <DollarSign className="w-4 h-4" />
                          {(() => {
                            const costoTiemposAdicionales = (servicio.tiemposAdicionales || []).reduce((sum, t) => sum + t.costo, 0);
                            const costoAdicionalesExtra = (servicio.adicionalesExtra || []).reduce((sum, a) => sum + a.costo, 0);
                            const costoConsumosDetallados = (servicio.consumosDetallados || []).reduce((sum, c) => sum + (c.costo * c.cantidad), 0);
                            const total = servicio.costoServicio + servicio.costoAdicionales + servicio.costoConsumo + 
                                         costoTiemposAdicionales + costoAdicionalesExtra + costoConsumosDetallados;
                            return total.toLocaleString('es-CO');
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {servicio.metodoPago}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Calendario de Servicios
              </CardTitle>
              <CardDescription className="mt-1">
                {obtenerTextoPeriodo()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={irHoy}>
                Hoy
              </Button>
              <div className="flex items-center border border-border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  onClick={navegarAnterior}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  onClick={navegarSiguiente}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Selector de vista */}
          <div className="flex gap-2 pt-4">
            <Button
              variant={vista === 'dia' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVista('dia')}
            >
              <List className="w-4 h-4 mr-2" />
              Día
            </Button>
            <Button
              variant={vista === 'semana' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVista('semana')}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Semana
            </Button>
            <Button
              variant={vista === 'mes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVista('mes')}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Mes
            </Button>
            <Button
              variant={vista === 'lista' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVista('lista')}
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </Button>
          </div>

          {/* Selector de filtro de tiempo - Solo en vista lista */}
          {vista === 'lista' && (
            <div className="flex gap-2 pt-4">
              <Button
                variant={filtroTiempo === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroTiempo('todos')}
              >
                <Filter className="w-4 h-4 mr-2" />
                Todos
              </Button>
              <Button
                variant={filtroTiempo === 'proximos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroTiempo('proximos')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Próximos
              </Button>
              <Button
                variant={filtroTiempo === 'pasados' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroTiempo('pasados')}
              >
                <History className="w-4 h-4 mr-2" />
                Pasados
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {vista === 'dia' && renderVistaDia()}
          {vista === 'semana' && renderVistaSemana()}
          {vista === 'mes' && renderVistaMes()}
          {vista === 'lista' && renderVistaLista()}
        </CardContent>
      </Card>

      {/* Modal de detalles del servicio */}
      <Dialog open={!!servicioSeleccionado} onOpenChange={() => setServicioSeleccionado(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-card backdrop-blur-lg border-primary/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Detalles del Servicio
            </DialogTitle>
            <DialogDescription>
              {servicioSeleccionado?.estado === 'activo' ? '🟢 Servicio en curso' : '✅ Servicio finalizado'} • {servicioSeleccionado?.horaInicio.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </DialogDescription>
          </DialogHeader>
          {servicioSeleccionado && (
            <ServicioDetalleCard 
              servicio={servicioSeleccionado} 
              mostrarCliente={puedeVerInfoCliente} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de información del cliente */}
      <ClienteInfoModal
        telefono={clienteTelefonoSeleccionado}
        open={!!clienteTelefonoSeleccionado}
        onOpenChange={() => setClienteTelefonoSeleccionado(null)}
      />
    </div>
  );
}