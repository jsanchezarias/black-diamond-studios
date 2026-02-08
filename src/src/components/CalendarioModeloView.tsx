import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '../app/components/ui/button';
import { Badge } from '../app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';

interface Agendamiento {
  id: string;
  fecha: string;
  fechaInicio: string;
  hora: string;
  duracion: number;
  clienteNombre: string;
  clienteTelefono: string;
  tipoServicio: 'sede' | 'domicilio';
  precioTotal?: number;
  estado: string;
  notas?: string;
}

interface CalendarioModeloViewProps {
  citas: Agendamiento[];
  onCitaClick?: (cita: Agendamiento) => void;
}

export function CalendarioModeloView({ citas, onCitaClick }: CalendarioModeloViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Obtener inicio y fin del mes actual
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Obtener todos los días del mes
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calcular día de inicio para la grid (rellenar con días del mes anterior)
  const startDayOfWeek = monthStart.getDay(); // 0 = Domingo
  const daysFromPrevMonth = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Ajustar para que Lunes sea el primer día

  // Organizar citas por fecha
  const citasPorFecha = useMemo(() => {
    const map = new Map<string, Agendamiento[]>();
    citas.forEach(cita => {
      const dateKey = format(new Date(cita.fechaInicio), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(cita);
    });
    // Ordenar citas de cada día por hora
    map.forEach(citasDelDia => {
      citasDelDia.sort((a, b) => a.hora.localeCompare(b.hora));
    });
    return map;
  }, [citas]);

  // Navegación
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <Card className="bg-gradient-to-br from-black/60 via-gray-900/60 to-black/60 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary">
            <CalendarIcon className="w-5 h-5" />
            {format(currentMonth, 'MMMM yyyy', { locale: es }).charAt(0).toUpperCase() + format(currentMonth, 'MMMM yyyy', { locale: es }).slice(1)}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToToday}
              className="h-8 px-3"
            >
              Hoy
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Grid del calendario */}
        <div className="grid grid-cols-7 gap-1">
          {/* Encabezados de días de la semana */}
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div 
              key={day} 
              className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase"
            >
              {day}
            </div>
          ))}

          {/* Días vacíos del mes anterior */}
          {Array.from({ length: daysFromPrevMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Días del mes actual */}
          {daysInMonth.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const citasDelDia = citasPorFecha.get(dateKey) || [];
            const hasEvents = citasDelDia.length > 0;
            const dayIsToday = isToday(day);

            return (
              <div
                key={dateKey}
                className={`
                  aspect-square border border-white/5 rounded-lg p-1.5 
                  ${dayIsToday ? 'bg-primary/10 border-primary/40' : 'bg-black/20'}
                  ${hasEvents ? 'hover:bg-white/5 cursor-pointer' : ''}
                  transition-colors relative overflow-hidden
                `}
              >
                {/* Número del día */}
                <div className={`
                  text-xs font-semibold mb-1
                  ${dayIsToday ? 'text-primary' : 'text-white'}
                `}>
                  {format(day, 'd')}
                </div>

                {/* Indicadores de citas */}
                {hasEvents && (
                  <div className="space-y-0.5">
                    {citasDelDia.slice(0, 2).map((cita, idx) => (
                      <div
                        key={cita.id}
                        onClick={() => onCitaClick?.(cita)}
                        className="text-xs px-1.5 py-0.5 rounded bg-purple-500/30 border border-purple-500/40 hover:bg-purple-500/40 transition-colors line-clamp-1"
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate text-[10px]">{cita.hora}</span>
                        </div>
                      </div>
                    ))}
                    {citasDelDia.length > 2 && (
                      <div className="text-[10px] text-center text-muted-foreground">
                        +{citasDelDia.length - 2} más
                      </div>
                    )}
                  </div>
                )}

                {/* Badge de hoy */}
                {dayIsToday && (
                  <div className="absolute top-1 right-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/10 border border-primary/40" />
            <span>Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500/30 border border-purple-500/40" />
            <span>Con citas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}