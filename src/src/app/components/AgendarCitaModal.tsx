import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, CreditCard, X, Building2, Home, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { DisponibilidadCalendario } from './DisponibilidadCalendario';
import { useAgendamientos } from './AgendamientosContext';
import { useModelos } from './ModelosContext';
import { usePublicUsers } from './PublicUsersContext';
import { Alert, AlertDescription } from './ui/alert';

interface AgendarCitaModalProps {
  open: boolean;
  onClose: () => void;
  modeloEmail: string;
}

// Tarifas a domicilio fijas según el brief
const TARIFAS_DOMICILIO = [
  { horas: 1, minutos: 60, precio: 250000, label: '1 hora' },
  { horas: 2, minutos: 120, precio: 480000, label: '2 horas' },
  { horas: 3, minutos: 180, precio: 690000, label: '3 horas' },
  { horas: 6, minutos: 360, precio: 1200000, label: '6 horas' },
  { horas: 8, minutos: 480, precio: 1500000, label: '8 horas' },
  { horas: 12, minutos: 720, precio: 2000000, label: '12 horas' },
  { horas: 24, minutos: 1440, precio: 2500000, label: '24 horas' },
];

export function AgendarCitaModal({ open, onClose, modeloEmail }: AgendarCitaModalProps) {
  const { agregarAgendamiento } = useAgendamientos();
  const { obtenerModeloPorEmail } = useModelos();
  const { currentUser } = usePublicUsers();
  
  const modelo = obtenerModeloPorEmail(modeloEmail);
  
  // Estados del formulario
  const [paso, setPaso] = useState(1); // 1: Tipo servicio, 2: Duración, 3: Fecha/Hora, 4: Confirmación
  const [tipoServicio, setTipoServicio] = useState<'sede' | 'domicilio' | null>(null);
  const [duracionSeleccionada, setDuracionSeleccionada] = useState<number | null>(null);
  const [servicioSedeSeleccionado, setServicioSedeSeleccionado] = useState<any>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // Resetear estados cuando se abre/cierra el modal
  useEffect(() => {
    if (open) {
      setPaso(1);
      setTipoServicio(null);
      setDuracionSeleccionada(null);
      setServicioSedeSeleccionado(null);
      setFechaSeleccionada(null);
      setHoraSeleccionada(null);
      setNotas('');
      setError(null);
      setExito(false);
    }
  }, [open]);

  if (!modelo) return null;

  // Calcular precio según selección
  const calcularPrecio = () => {
    if (tipoServicio === 'domicilio' && duracionSeleccionada) {
      const tarifa = TARIFAS_DOMICILIO.find(t => t.minutos === duracionSeleccionada);
      return tarifa?.precio || 0;
    }
    
    if (tipoServicio === 'sede' && servicioSedeSeleccionado) {
      // Extraer el precio del string (ejemplo: "$300.000")
      const precioStr = servicioSedeSeleccionado.price.replace(/[^0-9]/g, '');
      return parseInt(precioStr) || 0;
    }
    
    return 0;
  };

  // Formatear precio en pesos colombianos
  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio);
  };

  // Manejar selección de fecha/hora
  const handleSelectSlot = (fecha: string, hora: string) => {
    setFechaSeleccionada(fecha);
    setHoraSeleccionada(hora);
    setPaso(4); // Ir a confirmación
  };

  // Procesar pago y crear agendamiento
  const procesarReserva = async () => {
    if (!currentUser) {
      setError('Debes iniciar sesión para agendar una cita');
      return;
    }

    if (!fechaSeleccionada || !horaSeleccionada || !duracionSeleccionada) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const precio = calcularPrecio();
      
      // Crear agendamiento
      const resultado = await agregarAgendamiento({
        modeloEmail: modelo.email,
        modeloNombre: modelo.nombreArtistico,
        clienteId: currentUser.id,
        clienteNombre: currentUser.username,
        clienteTelefono: currentUser.telefono,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
        duracionMinutos: duracionSeleccionada,
        tipoServicio: tipoServicio || 'sede',
        estado: 'pendiente', // Cambiar a 'confirmado' cuando se procese el pago
        notas: notas || undefined,
        montoPago: precio,
        estadoPago: 'pendiente', // Se actualizará con la respuesta de la pasarela
        metodoPago: undefined,
        transaccionId: undefined,
        fechaPago: undefined,
      });

      if (resultado.success) {
        setExito(true);
        
        // Cerrar el modal después de 2 segundos
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(resultado.error?.message || 'Error al crear la reserva');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado al procesar la reserva');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-neutral-900 via-black to-neutral-950 border-amber-500/30">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl md:text-3xl font-playfair text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-600">
              Agendar Cita con {modelo.nombreArtistico}
            </DialogTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${paso >= num ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black' : 'bg-neutral-800 text-gray-500'}
                  `}
                >
                  {num}
                </div>
                {num < 4 && (
                  <div
                    className={`
                      w-12 h-1 mx-1
                      ${paso > num ? 'bg-gradient-to-r from-amber-600 to-yellow-500' : 'bg-neutral-800'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Paso 1: Seleccionar tipo de servicio */}
          {paso === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-amber-400 mb-4">Selecciona el tipo de servicio</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Servicio en sede */}
                {modelo.sede && (
                  <Card
                    onClick={() => {
                      setTipoServicio('sede');
                      setPaso(2);
                    }}
                    className={`
                      cursor-pointer transition-all duration-200 hover:scale-105
                      ${tipoServicio === 'sede' ? 'border-2 border-amber-500 bg-amber-500/10' : 'border border-amber-500/20 bg-neutral-900/50'}
                    `}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">Servicio en Sede</h4>
                          <p className="text-sm text-gray-400">{modelo.sede}</p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Disfruta de nuestras instalaciones premium en {modelo.sede}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Servicio a domicilio */}
                {modelo.domicilio && (
                  <Card
                    onClick={() => {
                      setTipoServicio('domicilio');
                      setPaso(2);
                    }}
                    className={`
                      cursor-pointer transition-all duration-200 hover:scale-105
                      ${tipoServicio === 'domicilio' ? 'border-2 border-amber-500 bg-amber-500/10' : 'border border-amber-500/20 bg-neutral-900/50'}
                    `}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 flex items-center justify-center">
                          <Home className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">Servicio a Domicilio</h4>
                          <p className="text-sm text-gray-400">En tu ubicación</p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Servicio exclusivo en la comodidad de tu espacio
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: Seleccionar duración/servicio */}
          {paso === 2 && tipoServicio === 'sede' && (
            <div className="space-y-4">
              <Button
                onClick={() => setPaso(1)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white mb-2"
              >
                ← Volver
              </Button>
              
              <h3 className="text-xl font-semibold text-amber-400 mb-4">Selecciona el servicio</h3>
              
              <div className="space-y-3">
                {(modelo.serviciosDisponibles || []).map((servicio: any, idx: number) => (
                  <Card
                    key={idx}
                    onClick={() => {
                      setServicioSedeSeleccionado(servicio);
                      // Extraer duración en minutos del string (ejemplo: "1 hora")
                      const duracionTexto = servicio.duration.toLowerCase();
                      let minutos = 60; // Default
                      if (duracionTexto.includes('30 min')) minutos = 30;
                      else if (duracionTexto.includes('1 hora')) minutos = 60;
                      else if (duracionTexto.includes('2 hora')) minutos = 120;
                      else if (duracionTexto.includes('3 hora')) minutos = 180;
                      setDuracionSeleccionada(minutos);
                      setPaso(3);
                    }}
                    className={`
                      cursor-pointer transition-all duration-200 hover:scale-102
                      ${servicioSedeSeleccionado?.name === servicio.name ? 'border-2 border-amber-500 bg-amber-500/10' : 'border border-amber-500/20 bg-neutral-900/50'}
                    `}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{servicio.name}</h4>
                          <p className="text-sm text-gray-400">{servicio.duration}</p>
                          {servicio.description && (
                            <p className="text-xs text-gray-500 mt-1">{servicio.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-amber-400">{servicio.price}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {paso === 2 && tipoServicio === 'domicilio' && (
            <div className="space-y-4">
              <Button
                onClick={() => setPaso(1)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white mb-2"
              >
                ← Volver
              </Button>
              
              <h3 className="text-xl font-semibold text-amber-400 mb-4">Selecciona la duración</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TARIFAS_DOMICILIO.map((tarifa) => (
                  <Card
                    key={tarifa.minutos}
                    onClick={() => {
                      setDuracionSeleccionada(tarifa.minutos);
                      setPaso(3);
                    }}
                    className={`
                      cursor-pointer transition-all duration-200 hover:scale-105
                      ${duracionSeleccionada === tarifa.minutos ? 'border-2 border-amber-500 bg-amber-500/10' : 'border border-amber-500/20 bg-neutral-900/50'}
                    `}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="text-lg font-bold text-white mb-1">{tarifa.label}</p>
                      <p className="text-xl font-bold text-amber-400">{formatPrecio(tarifa.precio)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Paso 3: Seleccionar fecha y hora */}
          {paso === 3 && duracionSeleccionada && (
            <div className="space-y-4">
              <Button
                onClick={() => setPaso(2)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white mb-2"
              >
                ← Volver
              </Button>
              
              <h3 className="text-xl font-semibold text-amber-400 mb-4">Selecciona fecha y hora</h3>
              
              <DisponibilidadCalendario
                modeloEmail={modelo.email}
                duracionMinutos={duracionSeleccionada}
                onSelectSlot={handleSelectSlot}
              />
            </div>
          )}

          {/* Paso 4: Confirmación y pago */}
          {paso === 4 && !exito && (
            <div className="space-y-6">
              <Button
                onClick={() => setPaso(3)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white mb-2"
              >
                ← Volver
              </Button>
              
              <h3 className="text-xl font-semibold text-amber-400 mb-4">Confirmar reserva</h3>

              {/* Resumen de la reserva */}
              <Card className="bg-neutral-900/50 border-amber-500/20">
                <CardContent className="p-6 space-y-4">
                  {/* Modelo */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden">
                      <ImageWithFallback
                        src={modelo.fotoPerfil}
                        alt={modelo.nombreArtistico}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{modelo.nombreArtistico}</h4>
                      <p className="text-sm text-gray-400">{modelo.sede}</p>
                    </div>
                  </div>

                  <div className="border-t border-amber-500/20 pt-4 space-y-3">
                    {/* Tipo de servicio */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Tipo de servicio:</span>
                      <Badge className={tipoServicio === 'sede' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}>
                        {tipoServicio === 'sede' ? (
                          <><Building2 className="w-3 h-3 mr-1" /> Sede</>
                        ) : (
                          <><Home className="w-3 h-3 mr-1" /> Domicilio</>
                        )}
                      </Badge>
                    </div>

                    {/* Servicio seleccionado */}
                    {tipoServicio === 'sede' && servicioSedeSeleccionado && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Servicio:</span>
                        <span className="text-white font-semibold">{servicioSedeSeleccionado.name}</span>
                      </div>
                    )}

                    {/* Duración */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Duración:</span>
                      <span className="text-white font-semibold">
                        {TARIFAS_DOMICILIO.find(t => t.minutos === duracionSeleccionada)?.label || `${duracionSeleccionada} min`}
                      </span>
                    </div>

                    {/* Fecha y hora */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Fecha y hora:</span>
                      <span className="text-white font-semibold">
                        {fechaSeleccionada && new Date(fechaSeleccionada).toLocaleDateString('es-CO')} - {horaSeleccionada}
                      </span>
                    </div>

                    {/* Total */}
                    <div className="border-t border-amber-500/20 pt-3 flex justify-between items-center">
                      <span className="text-lg font-semibold text-white">Total:</span>
                      <span className="text-2xl font-bold text-amber-400">{formatPrecio(calcularPrecio())}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notas adicionales */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Notas adicionales (opcional)</label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Agrega cualquier información adicional..."
                  className="bg-black/50 border-amber-500/30 text-white min-h-[100px]"
                />
              </div>

              {/* Errores */}
              {error && (
                <Alert className="bg-red-500/10 border-red-500/50">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              {/* Botón de pago */}
              <Button
                onClick={procesarReserva}
                disabled={cargando}
                className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold py-6 text-lg gap-2"
              >
                <CreditCard className="w-5 h-5" />
                {cargando ? 'Procesando...' : `Pagar ${formatPrecio(calcularPrecio())}`}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Al confirmar, serás redirigido a la pasarela de pago segura
              </p>
            </div>
          )}

          {/* Mensaje de éxito */}
          {exito && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-green-500 mb-2">¡Reserva creada con éxito!</h3>
              <p className="text-gray-400">
                Recibirás un correo con los detalles de tu cita
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
