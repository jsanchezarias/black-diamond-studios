import { useState, useEffect } from 'react';
import { Bell, Settings, Trash2, CheckCheck, Filter, Search } from 'lucide-react';
import { useNotificaciones, TipoNotificacion, obtenerIconoNotificacion, obtenerColorPrioridad } from './NotificacionesContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Separator } from '../../../components/ui/separator';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function NotificacionesPanel() {
  const {
    notificaciones,
    noLeidas,
    preferencias,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    limpiarNotificacionesAntiguas,
    actualizarPreferencias
  } = useNotificaciones();

  const [filtroTipo, setFiltroTipo] = useState<TipoNotificacion | 'todas'>('todas');
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'leidas' | 'no_leidas'>('todas');
  const [busqueda, setBusqueda] = useState('');

  // Filtrar notificaciones
  const notificacionesFiltradas = notificaciones.filter(notif => {
    // Filtro por tipo
    if (filtroTipo !== 'todas' && notif.tipo !== filtroTipo) return false;
    
    // Filtro por estado
    if (filtroEstado === 'leidas' && !notif.leida) return false;
    if (filtroEstado === 'no_leidas' && notif.leida) return false;
    
    // Filtro por búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      return (
        notif.titulo.toLowerCase().includes(busquedaLower) ||
        notif.mensaje.toLowerCase().includes(busquedaLower)
      );
    }
    
    return true;
  });

  const handleEliminarNotificacion = async (id: string) => {
    try {
      await eliminarNotificacion(id);
      toast.success('Notificación eliminada');
    } catch (error) {
      toast.error('Error al eliminar notificación');
    }
  };

  const handleLimpiarAntiguas = async () => {
    try {
      await limpiarNotificacionesAntiguas();
      toast.success('Notificaciones antiguas eliminadas');
    } catch (error) {
      toast.error('Error al limpiar notificaciones');
    }
  };

  const handleActualizarPreferencia = async (campo: string, valor: any) => {
    try {
      await actualizarPreferencias({ [campo]: valor });
      toast.success('Preferencia actualizada');
    } catch (error) {
      toast.error('Error al actualizar preferencia');
    }
  };

  const formatearTiempoRelativo = (fecha: string) => {
    try {
      return formatDistanceToNow(new Date(fecha), {
        addSuffix: true,
        locale: es
      });
    } catch {
      return 'Hace un momento';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                Centro de Notificaciones
              </CardTitle>
              <CardDescription>
                Gestiona tus notificaciones y preferencias
              </CardDescription>
            </div>
            {noLeidas > 0 && (
              <Badge variant="default" className="text-lg px-4 py-2">
                {noLeidas} {noLeidas === 1 ? 'nueva' : 'nuevas'}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="notificaciones" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="notificaciones">
            <Bell className="w-4 h-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="configuracion">
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* Tab de Notificaciones */}
        <TabsContent value="notificaciones" className="space-y-4">
          {/* Filtros y Acciones */}
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtro por tipo */}
                <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todos los tipos</SelectItem>
                    <SelectItem value="agendamiento_nuevo">Agendamientos</SelectItem>
                    <SelectItem value="pago_recibido">Pagos</SelectItem>
                    <SelectItem value="multa_aplicada">Multas</SelectItem>
                    <SelectItem value="servicio_completado">Servicios</SelectItem>
                    <SelectItem value="sistema">Sistema</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro por estado */}
                <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="no_leidas">No leídas</SelectItem>
                    <SelectItem value="leidas">Leídas</SelectItem>
                  </SelectContent>
                </Select>

                {/* Acciones */}
                <div className="flex gap-2">
                  {noLeidas > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={marcarTodasComoLeidas}
                      className="flex-1"
                    >
                      <CheckCheck className="w-4 h-4 mr-2" />
                      Marcar leídas
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLimpiarAntiguas}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar
                  </Button>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{notificaciones.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{noLeidas}</p>
                  <p className="text-sm text-muted-foreground">No leídas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">
                    {notificaciones.filter(n => n.leida).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Leídas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Notificaciones */}
          <Card className="border-primary/20">
            <ScrollArea className="h-[600px]">
              {notificacionesFiltradas.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    No hay notificaciones
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {busqueda 
                      ? 'Intenta con otros términos de búsqueda' 
                      : 'No tienes notificaciones en este momento'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notificacionesFiltradas.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-primary/5 transition-colors ${
                        !notif.leida ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Icono */}
                        <div className="flex-shrink-0 text-3xl">
                          {notif.icono || obtenerIconoNotificacion(notif.tipo)}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <h3 className={`text-base font-semibold mb-1 ${
                                !notif.leida ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {notif.titulo}
                              </h3>
                              <p className={`text-sm ${
                                !notif.leida ? 'text-foreground/90' : 'text-muted-foreground'
                              }`}>
                                {notif.mensaje}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={obtenerColorPrioridad(notif.prioridad)}
                              >
                                {notif.prioridad}
                              </Badge>
                              {!notif.leida && (
                                <div className="w-2 h-2 bg-primary rounded-full" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 mt-3">
                            <p className="text-xs text-muted-foreground">
                              {formatearTiempoRelativo(notif.fechaCreacion)}
                            </p>
                            
                            <div className="flex items-center gap-2">
                              {!notif.leida && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => marcarComoLeida(notif.id)}
                                  className="text-xs"
                                >
                                  <CheckCheck className="w-3 h-3 mr-1" />
                                  Marcar leída
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEliminarNotificacion(notif.id)}
                                className="text-xs text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Tab de Configuración */}
        <TabsContent value="configuracion" className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>
                Configura cómo y cuándo recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Canales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Canales de Notificación</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificaciones en la aplicación</Label>
                      <p className="text-sm text-muted-foreground">
                        Ver notificaciones dentro de la app
                      </p>
                    </div>
                    <Switch
                      checked={preferencias?.enApp ?? true}
                      onCheckedChange={(v) => handleActualizarPreferencia('enApp', v)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between opacity-50">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Próximamente disponible
                      </p>
                    </div>
                    <Switch disabled checked={false} />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between opacity-50">
                    <div>
                      <Label>Notificaciones por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Próximamente disponible
                      </p>
                    </div>
                    <Switch disabled checked={false} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tipos de Notificación */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tipos de Notificación</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Agendamientos</Label>
                    <Switch
                      checked={preferencias?.notificarAgendamientos ?? true}
                      onCheckedChange={(v) => handleActualizarPreferencia('notificarAgendamientos', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Pagos y Liquidaciones</Label>
                    <Switch
                      checked={preferencias?.notificarPagos ?? true}
                      onCheckedChange={(v) => handleActualizarPreferencia('notificarPagos', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Multas y Penalizaciones</Label>
                    <Switch
                      checked={preferencias?.notificarMultas ?? true}
                      onCheckedChange={(v) => handleActualizarPreferencia('notificarMultas', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Servicios Completados</Label>
                    <Switch
                      checked={preferencias?.notificarServicios ?? true}
                      onCheckedChange={(v) => handleActualizarPreferencia('notificarServicios', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Notificaciones del Sistema</Label>
                    <Switch
                      checked={preferencias?.notificarSistema ?? true}
                      onCheckedChange={(v) => handleActualizarPreferencia('notificarSistema', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Marketing y Promociones</Label>
                    <Switch
                      checked={preferencias?.notificarMarketing ?? false}
                      onCheckedChange={(v) => handleActualizarPreferencia('notificarMarketing', v)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Horario de Silencio */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Horario de Silencio</h3>
                <p className="text-sm text-muted-foreground">
                  No recibir notificaciones durante estos horarios
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hora de inicio</Label>
                    <Input
                      type="time"
                      value={preferencias?.horaInicioSilencio || ''}
                      onChange={(e) => handleActualizarPreferencia('horaInicioSilencio', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Hora de fin</Label>
                    <Input
                      type="time"
                      value={preferencias?.horaFinSilencio || ''}
                      onChange={(e) => handleActualizarPreferencia('horaFinSilencio', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}