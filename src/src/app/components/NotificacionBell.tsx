import { Bell } from 'lucide-react';
import { useNotificaciones, obtenerIconoNotificacion, obtenerColorPrioridad } from './NotificacionesContext';
import { Button } from '../../../components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificacionBell() {
  const {
    notificaciones,
    noLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    obtenerNotificacionesRecientes
  } = useNotificaciones();

  const notificacionesRecientes = obtenerNotificacionesRecientes(10);

  const handleNotificacionClick = async (notificacionId: string, accion?: any) => {
    // Marcar como leída
    await marcarComoLeida(notificacionId);

    // Ejecutar acción si existe
    if (accion) {
      if (accion.tipo === 'navegar' && accion.destino) {
        window.location.href = accion.destino;
      } else if (accion.tipo === 'modal' && accion.destino) {
        // TODO: Abrir modal específico
        console.log('Abrir modal:', accion.destino, accion.datos);
      }
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-primary/10"
        >
          <Bell className="h-5 w-5 text-foreground" />
          {noLeidas > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold"
            >
              {noLeidas > 99 ? '99+' : noLeidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0 border-primary/30 bg-card/95 backdrop-blur-sm" 
        align="end"
      >
        {/* Header */}
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-foreground">
              Notificaciones
            </h3>
            {noLeidas > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={marcarTodasComoLeidas}
                className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                Marcar todas leídas
              </Button>
            )}
          </div>
          {noLeidas > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {noLeidas} {noLeidas === 1 ? 'notificación nueva' : 'notificaciones nuevas'}
            </p>
          )}
        </div>

        {/* Lista de notificaciones */}
        <ScrollArea className="h-[400px]">
          {notificacionesRecientes.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No tienes notificaciones
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notificacionesRecientes.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificacionClick(notif.id, notif.accion)}
                  className={`p-4 hover:bg-primary/5 cursor-pointer transition-colors ${
                    !notif.leida ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icono */}
                    <div className="flex-shrink-0 text-2xl">
                      {notif.icono || obtenerIconoNotificacion(notif.tipo)}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`text-sm font-medium ${
                          !notif.leida ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notif.titulo}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${obtenerColorPrioridad(notif.prioridad)}`}
                        >
                          {notif.prioridad}
                        </Badge>
                      </div>
                      
                      <p className={`text-sm ${
                        !notif.leida ? 'text-foreground/80' : 'text-muted-foreground'
                      } line-clamp-2`}>
                        {notif.mensaje}
                      </p>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatearTiempoRelativo(notif.fechaCreacion)}
                      </p>
                    </div>

                    {/* Indicador de no leída */}
                    {!notif.leida && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notificaciones.length > 10 && (
          <>
            <Separator />
            <div className="p-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-primary hover:bg-primary/10"
                onClick={() => {
                  // TODO: Navegar a página completa de notificaciones
                  console.log('Ver todas las notificaciones');
                }}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}