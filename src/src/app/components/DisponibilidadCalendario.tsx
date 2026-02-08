import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAgendamientos } from './AgendamientosContext';

interface DisponibilidadCalendarioProps {
  modeloEmail: string;
  onSelectSlot: (fecha: string, hora: string) => void;
  duracionMinutos: number; // Duración del servicio seleccionado para calcular conflictos
}

export function DisponibilidadCalendario({ 
  modeloEmail, 
  onSelectSlot,
  duracionMinutos 
}: DisponibilidadCalendarioProps) {
  const { agendamientos } = useAgendamientos();
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);

  // Horarios disponibles (8 AM a 11 PM)
  const HORARIOS = [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00'
  ];

  // Navegar entre meses
  const mesAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1));
  };

  const mesSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1));
  };

  // Obtener días del mes
  const getDiasDelMes = () => {
    const year = mesActual.getFullYear();
    const month = mesActual.getMonth();
    
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
    const dias: (Date | null)[] = [];
    
    // Agregar días vacíos al inicio para alinear con el día de la semana
    const primerDiaSemana = primerDia.getDay();
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push(null);
    }
    
    // Agregar todos los días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(year, month, dia));
    }
    
    return dias;
  };

  // Verificar si un día está disponible (tiene al menos 1 slot libre)
  const isDiaDisponible = (fecha: Date) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // No permitir días pasados
    if (fecha < hoy) return false;
    
    // Verificar si hay al menos un slot disponible
    const slotsDisponibles = HORARIOS.some(hora => 
      isSlotDisponible(fecha, hora)
    );
    
    return slotsDisponibles;
  };

  // Verificar si un slot específico está disponible
  const isSlotDisponible = (fecha: Date, hora: string) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    const horaInicio = hora;
    const [horas, minutos] = hora.split(':').map(Number);
    
    // Calcular hora de fin según duración
    const minutosInicio = horas * 60 + minutos;
    const minutosFin = minutosInicio + duracionMinutos;
    
    // Convertir minutos totales a hora:minuto
    const horasFin = Math.floor(minutosFin / 60);
    const minutosFin2 = minutosFin % 60;
    const horaFin = `${horasFin.toString().padStart(2, '0')}:${minutosFin2.toString().padStart(2, '0')}`;
    
    // Buscar conflictos con agendamientos existentes
    const hayConflicto = agendamientos.some(agendamiento => {
      if (agendamiento.modeloEmail !== modeloEmail) return false;
      if (agendamiento.estado === 'cancelado') return false;
      if (agendamiento.fecha !== fechaStr) return false;
      
      // Calcular hora de fin del agendamiento existente
      const [aHoras, aMinutos] = agendamiento.hora.split(':').map(Number);
      const aMinutosInicio = aHoras * 60 + aMinutos;
      const aMinutosFin = aMinutosInicio + agendamiento.duracionMinutos;
      
      // Verificar si hay solapamiento
      const nuevoInicio = minutosInicio;
      const nuevoFin = minutosFin;
      const existenteInicio = aMinutosInicio;
      const existenteFin = aMinutosFin;
      
      return (
        (nuevoInicio >= existenteInicio && nuevoInicio < existenteFin) ||
        (nuevoFin > existenteInicio && nuevoFin <= existenteFin) ||
        (nuevoInicio <= existenteInicio && nuevoFin >= existenteFin)
      );
    });
    
    // No permitir slots que terminen después de las 23:00 (última hora)
    if (horasFin > 23) return false;
    
    // Si es hoy, no permitir horas pasadas
    const ahora = new Date();
    if (
      fecha.toDateString() === ahora.toDateString() &&
      horas < ahora.getHours()
    ) {
      return false;
    }
    
    return !hayConflicto;
  };

  // Obtener cantidad de slots disponibles en un día
  const getSlotsDisponibles = (fecha: Date) => {
    return HORARIOS.filter(hora => isSlotDisponible(fecha, hora)).length;
  };

  // Confirmar selección
  const confirmarSeleccion = () => {
    if (diaSeleccionado && horaSeleccionada) {
      const fechaStr = diaSeleccionado.toISOString().split('T')[0];
      onSelectSlot(fechaStr, horaSeleccionada);
    }
  };

  const dias = getDiasDelMes();
  const nombreMes = mesActual.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="w-full">
      {/* Navegación del mes */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={mesAnterior}
          variant="ghost"
          size="sm"
          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <h3 className="text-xl font-playfair font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-600 capitalize">
          {nombreMes}
        </h3>
        
        <Button
          onClick={mesSiguiente}
          variant="ghost"
          size="sm"
          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendario */}
      <div className="mb-6">
        {/* Cabecera de días de la semana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {diasSemana.map((dia) => (
            <div
              key={dia}
              className="text-center text-xs font-semibold text-gray-500 py-2"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-2">
          {dias.map((dia, idx) => {
            if (!dia) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const disponible = isDiaDisponible(dia);
            const seleccionado = diaSeleccionado?.toDateString() === dia.toDateString();
            const slotsDisponibles = getSlotsDisponibles(dia);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const esHoy = dia.toDateString() === hoy.toDateString();
            const esPasado = dia < hoy;

            return (
              <button
                key={idx}
                onClick={() => {
                  if (disponible) {
                    setDiaSeleccionado(dia);
                    setHoraSeleccionada(null);
                  }
                }}
                disabled={!disponible}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium
                  transition-all duration-200 relative group
                  ${esPasado ? 'text-gray-700 bg-neutral-950 cursor-not-allowed' : ''}
                  ${disponible && !seleccionado && !esPasado ? 'text-white bg-neutral-900 hover:bg-neutral-800 border border-amber-500/20 hover:border-amber-500/60 cursor-pointer' : ''}
                  ${!disponible && !esPasado ? 'text-gray-600 bg-neutral-950 opacity-50 cursor-not-allowed' : ''}
                  ${seleccionado ? 'bg-gradient-to-br from-amber-600 to-yellow-500 text-black font-bold border-2 border-amber-400 shadow-lg shadow-amber-500/30' : ''}
                  ${esHoy ? 'ring-2 ring-blue-500/50' : ''}
                `}
              >
                <span className="text-base">{dia.getDate()}</span>
                {disponible && slotsDisponibles > 0 && !seleccionado && (
                  <span className="text-[10px] text-amber-400 mt-0.5">
                    {slotsDisponibles} slots
                  </span>
                )}
                
                {esHoy && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selección de hora */}
      {diaSeleccionado && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <CalendarIcon className="w-5 h-5" />
            <span className="font-semibold">
              {diaSeleccionado.toLocaleDateString('es-CO', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-gray-300">Selecciona una hora</h4>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {HORARIOS.map((hora) => {
                const disponible = isSlotDisponible(diaSeleccionado, hora);
                const seleccionado = horaSeleccionada === hora;

                return (
                  <button
                    key={hora}
                    onClick={() => {
                      if (disponible) {
                        setHoraSeleccionada(hora);
                      }
                    }}
                    disabled={!disponible}
                    className={`
                      py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200
                      ${disponible && !seleccionado ? 'bg-neutral-900 text-white border border-amber-500/20 hover:border-amber-500/60 hover:bg-neutral-800 cursor-pointer' : ''}
                      ${!disponible ? 'bg-neutral-950 text-gray-700 opacity-50 cursor-not-allowed line-through' : ''}
                      ${seleccionado ? 'bg-gradient-to-br from-amber-600 to-yellow-500 text-black font-bold border-2 border-amber-400 shadow-lg shadow-amber-500/30' : ''}
                    `}
                  >
                    {hora}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón de confirmación */}
          {horaSeleccionada && (
            <Button
              onClick={confirmarSeleccion}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold py-6 text-lg gap-2"
            >
              <CalendarIcon className="w-5 h-5" />
              Confirmar: {diaSeleccionado.toLocaleDateString('es-CO')} a las {horaSeleccionada}
            </Button>
          )}
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-6 pt-4 border-t border-amber-500/20">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-neutral-900 border border-amber-500/20 rounded" />
            <span className="text-gray-400">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-neutral-950 opacity-50 rounded" />
            <span className="text-gray-400">Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-amber-600 to-yellow-500 rounded" />
            <span className="text-gray-400">Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-neutral-900 border-2 border-blue-500/50 rounded" />
            <span className="text-gray-400">Hoy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
