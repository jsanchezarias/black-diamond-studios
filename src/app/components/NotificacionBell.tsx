import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotificaciones, Notificacion, obtenerIconoNotificacion, obtenerColorPrioridad } from './NotificacionesContext';
import { SolicitudEntradaModal } from './SolicitudEntradaModal';
import { Button } from '../../components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos de notificación que tienen acción directa (abren modal)
const TIPOS_CON_MODAL = ['solicitud_entrada'];

// Tipos que requieren acción — muestran badge especial
const TIPOS_ACCION_REQUERIDA = ['solicitud_entrada'];

export function NotificacionBell() {
  const {
    notificaciones: listadoNotificaciones = [],
    noLeidas = 0,
    marcarComoLeida,
    marcarTodasComoLeidas,
    obtenerNotificacionesRecientes
  } = useNotificaciones();

  const [solicitudModalId, setSolicitudModalId] = useState<string | null>(null);

  const notificacionesRecientes = typeof obtenerNotificacionesRecientes === 'function'
    ? obtenerNotificacionesRecientes(10)
    : [];

  const handleNotificacionClick = async (notif: Notificacion) => {
    await marcarComoLeida(notif.id);

    const tipo = notif.tipo as string;

    if (tipo === 'solicitud_entrada' && notif.referencia_id) {
      setSolicitudModalId(notif.referencia_id);
      return;
    }

    // Acción de navegación genérica
    if (notif.accion?.tipo === 'navegar' && notif.accion.destino) {
      window.location.href = notif.accion.destino;
    }
  };

  const formatearTiempoRelativo = (fecha: string) => {
    try {
      return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es });
    } catch {
      return 'Hace un momento';
    }
  };

  return (
    <>
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

          {/* Lista */}
          <ScrollArea className="h-[400px]">
            {notificacionesRecientes.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notificacionesRecientes.map((notif) => {
                  const tipo = notif.tipo as string;
                  const esAccionRequerida = TIPOS_ACCION_REQUERIDA.includes(tipo) && !notif.leida;
                  const tieneModal = TIPOS_CON_MODAL.includes(tipo);

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificacionClick(notif)}
                      className={`p-4 cursor-pointer transition-all duration-200 ${
                        !notif.leida
                          ? 'bg-primary/10 hover:bg-primary/15'
                          : 'hover:bg-primary/5'
                      } ${tieneModal ? 'active:scale-[0.99]' : ''}`}
                    >
                      <div className="flex gap-3">
                        {/* Ícono */}
                        <div className="flex-shrink-0 text-2xl">
                          {notif.icono || obtenerIconoNotificacion(notif.tipo)}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-medium ${!notif.leida ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notif.titulo}
                              </h4>
                              {esAccionRequerida && (
                                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#c9a961] text-[#0f1014] font-bold">
                                  Acción requerida
                                </span>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${obtenerColorPrioridad(notif.prioridad)}`}
                            >
                              {notif.prioridad}
                            </Badge>
                          </div>

                          <p className={`text-sm ${!notif.leida ? 'text-foreground/80' : 'text-muted-foreground'} line-clamp-2`}>
                            {notif.mensaje}
                          </p>

                          <p className="text-xs text-muted-foreground mt-2">
                            {formatearTiempoRelativo(notif.fechaCreacion)}
                          </p>
                        </div>

                        {/* Punto rojo */}
                        {!notif.leida && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {(listadoNotificaciones || []).length > 10 && (
            <>
              <Separator />
              <div className="p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-primary hover:bg-primary/10"
                >
                  Ver todas las notificaciones
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Modal de solicitud de entrada — fuera del Popover para evitar z-index issues */}
      {solicitudModalId && (
        <SolicitudEntradaModal
          solicitudId={solicitudModalId}
          onClose={() => setSolicitudModalId(null)}
        />
      )}
    </>
  );
}
