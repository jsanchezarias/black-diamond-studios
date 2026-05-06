import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

interface ServicioDirectoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    email: string;
    nombre: string;
  };
  onSuccess: () => void;
}

export function ServicioDirectoModal({ isOpen, onClose, currentUser, onSuccess }: ServicioDirectoModalProps) {
  const [loading, setLoading] = useState(false);
  const [habitaciones, setHabitaciones] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    notas: '',
    servicioTipo: '1 Hora',
    duracionMinutos: 60,
    precio: '',
    ubicacion: 'Sede',
    habitacionId: '',
    habitacionNumero: '',
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }),
    metodoPago: 'Efectivo',
    referenciaPago: ''
  });

  const serviciosOptions = [
    { label: 'Rato', mins: 45 },
    { label: '30 Minutos', mins: 30 },
    { label: '1 Hora', mins: 60 },
    { label: '2 Horas', mins: 120 },
    { label: '3 Horas', mins: 180 },
    { label: '6 Horas', mins: 360 }
  ];

  useEffect(() => {
    if (isOpen) {
      cargarHabitaciones();
    }
  }, [isOpen]);

  const cargarHabitaciones = async () => {
    const { data } = await supabase.from('habitaciones').select('*').order('numero');
    setHabitaciones(data || []);
  };

  const handleServicioChange = (tipo: string) => {
    const opt = serviciosOptions.find(o => o.label === tipo);
    setFormData(prev => ({
      ...prev,
      servicioTipo: tipo,
      duracionMinutos: opt ? opt.mins : 60
    }));
  };

  const registrarServicioDirecto = async (iniciarAhora = false) => {
    if (!formData.clienteNombre || !formData.precio || !formData.servicioTipo) {
      toast.error('Completa los campos obligatorios: cliente, servicio y precio');
      return;
    }

    setLoading(true);

    try {
      // Verificar habitación disponible si es sede
      if (formData.ubicacion === 'Sede' && formData.habitacionId) {
        const { data: habOcupada } = await supabase
          .from('habitaciones')
          .select('estado, numero')
          .eq('id', formData.habitacionId)
          .single();

        if (habOcupada?.estado === 'ocupada') {
          toast.error('Esa habitación está ocupada. Selecciona otra.');
          setLoading(false);
          return;
        }
        formData.habitacionNumero = habOcupada?.numero?.toString() || '';
      }

      const ahora = new Date().toISOString();
      const estado = iniciarAhora ? 'en_curso' : 'creado_por_modelo';

      // Crear el agendamiento
      const { data: agendamiento, error } = await supabase
        .from('agendamientos')
        .insert({
          cliente_nombre: formData.clienteNombre,
          cliente_telefono: formData.clienteTelefono || null,
          modelo_email: currentUser.email,
          modelo_nombre: currentUser.nombre || currentUser.email,
          modelo_id: currentUser.id,
          tipo_servicio: formData.servicioTipo,
          duracion_minutos: formData.duracionMinutos,
          precio: parseFloat(formData.precio),
          ubicacion: formData.ubicacion.toLowerCase(),
          habitacion_id: formData.habitacionId || null,
          habitacion_numero: formData.habitacionNumero ? parseInt(formData.habitacionNumero) : null,
          fecha: formData.fecha,
          hora: formData.horaInicio,
          metodo_pago: formData.metodoPago || 'Efectivo',
          referencia_pago: formData.referenciaPago || null,
          notas: formData.notas || null,
          estado: estado,
          creado_por_rol: 'modelo',
          creado_por: currentUser.email,
          hora_inicio_real: iniciarAhora ? ahora : null,
          created_at: ahora,
          updated_at: ahora
        })
        .select()
        .single();

      if (error) throw error;

      // Si inicia ahora → marcar habitación como ocupada
      if (iniciarAhora && formData.habitacionId) {
        await supabase
          .from('habitaciones')
          .update({
            estado: 'ocupada',
            modelo_nombre: currentUser.nombre || currentUser.email,
            hora_inicio: ahora,
            updated_at: ahora
          })
          .eq('id', formData.habitacionId);
      }

      // Notificar a Admin y Owner
      const { data: adminsOwners } = await supabase
        .from('usuarios')
        .select('id, email')
        .in('role', ['admin', 'owner']);

      if (adminsOwners?.length) {
        const tituloNotif = iniciarAhora
          ? '🟢 Servicio directo iniciado — ' + (currentUser.nombre || currentUser.email)
          : '📋 Servicio directo registrado — ' + (currentUser.nombre || currentUser.email);

        const mensajeNotif = [
          '👤 Modelo: ' + (currentUser.nombre || currentUser.email),
          '🧑 Cliente: ' + formData.clienteNombre,
          '💼 Servicio: ' + formData.servicioTipo,
          '⏱ Duración: ' + formData.duracionMinutos + ' min',
          '💵 Precio: $' + parseFloat(formData.precio).toLocaleString('es-CO'),
          '🏠 Habitación: ' + (formData.habitacionNumero || 'Sin asignar'),
          '💳 Pago: ' + (formData.metodoPago || 'Efectivo'),
          '📅 Fecha: ' + formData.fecha + ' ' + formData.horaInicio,
          '⚡ Origen: Servicio directo de la modelo'
        ].join('\n');

        await supabase.from('notificaciones').insert(
          adminsOwners.map(u => ({
            usuario_id: u.id,
            usuario_email: u.email,
            titulo: tituloNotif,
            mensaje: mensajeNotif,
            tipo: iniciarAhora ? 'servicio_directo_iniciado' : 'servicio_directo_registrado',
            referencia_id: agendamiento.id,
            leida: false,
            created_at: ahora
          }))
        );
      }

      if (iniciarAhora) {
        toast.success('✅ Servicio iniciado. Admin y Owner notificados.');
      } else {
        toast.success('💾 Servicio registrado. Admin y Owner notificados.');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Error al registrar el servicio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-[#1a1c23] border border-[#c9a961]/30 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#c9a961] flex items-center gap-2 text-xl">
            ⚡ Registrar Servicio Directo
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Ingresa los datos del cliente que llegó directamente por ti.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#c9a961] border-b border-[#c9a961]/20 pb-1">DATOS DEL CLIENTE</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nombre (Obligatorio)</Label>
                <Input
                  className="bg-black/50 border-gray-700"
                  value={formData.clienteNombre}
                  onChange={e => setFormData({ ...formData, clienteNombre: e.target.value })}
                  placeholder="Ej: Juan"
                />
              </div>
              <div className="space-y-1">
                <Label>Teléfono (Opcional)</Label>
                <Input
                  className="bg-black/50 border-gray-700"
                  value={formData.clienteTelefono}
                  onChange={e => setFormData({ ...formData, clienteTelefono: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notas (Opcional)</Label>
              <Input
                className="bg-black/50 border-gray-700"
                value={formData.notas}
                onChange={e => setFormData({ ...formData, notas: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#c9a961] border-b border-[#c9a961]/20 pb-1">SERVICIO</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo de Servicio</Label>
                <select
                  className="w-full h-10 px-3 bg-black/50 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]"
                  value={formData.servicioTipo}
                  onChange={e => handleServicioChange(e.target.value)}
                >
                  {serviciosOptions.map(o => (
                    <option key={o.label} value={o.label}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Precio Acordado</Label>
                <Input
                  type="number"
                  className="bg-black/50 border-gray-700"
                  value={formData.precio}
                  onChange={e => setFormData({ ...formData, precio: e.target.value })}
                  placeholder="Ej: 200000"
                />
              </div>
              <div className="space-y-1">
                <Label>Ubicación</Label>
                <select
                  className="w-full h-10 px-3 bg-black/50 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]"
                  value={formData.ubicacion}
                  onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
                >
                  <option value="Sede">Sede</option>
                  <option value="Domicilio">Domicilio</option>
                </select>
              </div>
              {formData.ubicacion === 'Sede' && (
                <div className="space-y-1">
                  <Label>Habitación</Label>
                  <select
                    className="w-full h-10 px-3 bg-black/50 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]"
                    value={formData.habitacionId}
                    onChange={e => setFormData({ ...formData, habitacionId: e.target.value })}
                  >
                    <option value="">(Sin asignar)</option>
                    {habitaciones.map(h => (
                      <option key={h.id} value={h.id} disabled={h.estado === 'ocupada'}>
                        Habitación {h.numero} {h.estado === 'ocupada' ? '(Ocupada)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#c9a961] border-b border-[#c9a961]/20 pb-1">FECHA Y HORA</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  className="bg-black/50 border-gray-700"
                  value={formData.fecha}
                  onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Hora de Inicio</Label>
                <Input
                  type="time"
                  className="bg-black/50 border-gray-700"
                  value={formData.horaInicio}
                  onChange={e => setFormData({ ...formData, horaInicio: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#c9a961] border-b border-[#c9a961]/20 pb-1">MÉTODO DE PAGO</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Método</Label>
                <select
                  className="w-full h-10 px-3 bg-black/50 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]"
                  value={formData.metodoPago}
                  onChange={e => setFormData({ ...formData, metodoPago: e.target.value })}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Referencia (Opcional)</Label>
                <Input
                  className="bg-black/50 border-gray-700"
                  value={formData.referenciaPago}
                  onChange={e => setFormData({ ...formData, referenciaPago: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={() => registrarServicioDirecto(true)}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
          >
            {loading ? 'Procesando...' : '🟢 REGISTRAR E INICIAR SERVICIO'}
          </Button>
          <Button
            onClick={() => registrarServicioDirecto(false)}
            disabled={loading}
            variant="outline"
            className="w-full border-[#c9a961] text-[#c9a961] hover:bg-[#c9a961]/10"
          >
            💾 Registrar como pendiente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
