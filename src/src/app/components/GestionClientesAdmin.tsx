import { useState, useEffect } from 'react';
import { useClientes, Cliente } from './ClientesContext';
import { useServicios, Servicio } from './ServiciosContext';
import { AlertTriangle, Ban, CheckCircle, DollarSign, X, User, Calendar, Clock, AlertCircle, TrendingUp, XCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function GestionClientesAdmin() {
  const { clientes, actualizarCliente } = useClientes();
  const { servicios, obtenerServiciosPorCliente, obtenerNoShowsPorCliente, contarNoShowsCliente, obtenerMultasPendientesCliente, calcularTotalMultasCliente, marcarMultaComoPagada } = useServicios();
  
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBloquearModal, setShowBloquearModal] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState('');
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showMultasModal, setShowMultasModal] = useState(false);
  const [filtro, setFiltro] = useState<'todos' | 'bloqueados' | 'con_multas' | 'con_noshow'>('todos');

  // Enriquecer clientes con datos de servicios
  const clientesEnriquecidos = clientes.map(cliente => {
    const serviciosCliente = obtenerServiciosPorCliente(cliente.id);
    const noShows = obtenerNoShowsPorCliente(cliente.id);
    const multasPendientes = obtenerMultasPendientesCliente(cliente.id);
    const totalMultas = calcularTotalMultasCliente(cliente.id);

    return {
      ...cliente,
      totalNoShows: noShows.length,
      multasPendientes: totalMultas,
      serviciosCount: serviciosCliente.length,
    };
  });

  // Filtrar clientes
  const clientesFiltrados = clientesEnriquecidos.filter(cliente => {
    // Filtro por búsqueda
    const matchSearch = 
      cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cliente.telefono.includes(searchQuery);

    if (!matchSearch) return false;

    // Filtro por categoría
    if (filtro === 'bloqueados') return cliente.bloqueado === true;
    if (filtro === 'con_multas') return (cliente.multasPendientes || 0) > 0;
    if (filtro === 'con_noshow') return (cliente.totalNoShows || 0) > 0;

    return true;
  });

  const handleBloquear = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowBloquearModal(true);
  };

  const confirmarBloqueo = async () => {
    if (!selectedCliente) return;

    try {
      await actualizarCliente(selectedCliente.id, {
        bloqueado: true,
        motivoBloqueo,
        fechaBloqueo: new Date().toISOString(),
        bloqueadoPor: 'admin', // TODO: Obtener del usuario logueado
      });

      toast.success(`Cliente ${selectedCliente.nombre} bloqueado exitosamente`);
      setShowBloquearModal(false);
      setMotivoBloqueo('');
      setSelectedCliente(null);
    } catch (error) {
      console.error('Error bloqueando cliente:', error);
      toast.error('Error al bloquear cliente');
    }
  };

  const handleDesbloquear = async (cliente: Cliente) => {
    try {
      await actualizarCliente(cliente.id, {
        bloqueado: false,
        motivoBloqueo: undefined,
        fechaBloqueo: undefined,
        bloqueadoPor: undefined,
      });

      toast.success(`Cliente ${cliente.nombre} desbloqueado exitosamente`);
    } catch (error) {
      console.error('Error desbloqueando cliente:', error);
      toast.error('Error al desbloquear cliente');
    }
  };

  const handleVerHistorial = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowHistorialModal(true);
  };

  const handleVerMultas = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowMultasModal(true);
  };

  const handlePagarMulta = async (servicioId: string) => {
    try {
      await marcarMultaComoPagada(servicioId);
      toast.success('Multa marcada como pagada');
    } catch (error) {
      console.error('Error marcando multa como pagada:', error);
      toast.error('Error al marcar multa como pagada');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-playfair text-[#D4AF37] mb-2">Gestión de Clientes</h1>
        <p className="text-gray-400">Historial, multas y bloqueos</p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-[#0A0A0A] rounded-lg p-6 mb-6 border border-[#1A1A1A]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Buscar cliente</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nombre o teléfono..."
              className="w-full px-4 py-2 bg-black border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Filtro */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Filtrar por</label>
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as any)}
              className="w-full px-4 py-2 bg-black border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="todos">Todos los clientes</option>
              <option value="bloqueados">Solo bloqueados</option>
              <option value="con_multas">Con multas pendientes</option>
              <option value="con_noshow">Con no-shows</option>
            </select>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-black p-4 rounded-lg border border-[#2A2A2A]">
            <p className="text-gray-400 text-sm">Total Clientes</p>
            <p className="text-2xl font-bold text-white">{clientes.length}</p>
          </div>
          <div className="bg-black p-4 rounded-lg border border-[#2A2A2A]">
            <p className="text-gray-400 text-sm">Bloqueados</p>
            <p className="text-2xl font-bold text-red-500">{clientesEnriquecidos.filter(c => c.bloqueado).length}</p>
          </div>
          <div className="bg-black p-4 rounded-lg border border-[#2A2A2A]">
            <p className="text-gray-400 text-sm">Con Multas</p>
            <p className="text-2xl font-bold text-orange-500">{clientesEnriquecidos.filter(c => (c.multasPendientes || 0) > 0).length}</p>
          </div>
          <div className="bg-black p-4 rounded-lg border border-[#2A2A2A]">
            <p className="text-gray-400 text-sm">Con No-Shows</p>
            <p className="text-2xl font-bold text-yellow-500">{clientesEnriquecidos.filter(c => (c.totalNoShows || 0) > 0).length}</p>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-[#0A0A0A] rounded-lg border border-[#1A1A1A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Servicios</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">No-Shows</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Multas</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-[#0F0F0F] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A961] flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{cliente.nombre}</p>
                        <p className="text-sm text-gray-400">ID: {cliente.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{cliente.telefono}</p>
                    {cliente.email && <p className="text-sm text-gray-400">{cliente.email}</p>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-white font-semibold">{cliente.serviciosCount || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(cliente.totalNoShows || 0) > 0 ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-500">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {cliente.totalNoShows}
                      </span>
                    ) : (
                      <span className="text-gray-500">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(cliente.multasPendientes || 0) > 0 ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-500">
                        <DollarSign className="w-3 h-3 mr-1" />
                        ${cliente.multasPendientes?.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-500">$0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {cliente.bloqueado ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-500">
                        <Ban className="w-3 h-3 mr-1" />
                        Bloqueado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleVerHistorial(cliente)}
                        className="px-3 py-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-lg text-sm transition-colors"
                      >
                        Historial
                      </button>
                      {(cliente.multasPendientes || 0) > 0 && (
                        <button
                          onClick={() => handleVerMultas(cliente)}
                          className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 rounded-lg text-sm transition-colors"
                        >
                          Multas
                        </button>
                      )}
                      {cliente.bloqueado ? (
                        <button
                          onClick={() => handleDesbloquear(cliente)}
                          className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg text-sm transition-colors"
                        >
                          Desbloquear
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBloquear(cliente)}
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-sm transition-colors"
                        >
                          Bloquear
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {clientesFiltrados.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No se encontraron clientes</p>
          </div>
        )}
      </div>

      {/* Modal de bloqueo */}
      {showBloquearModal && selectedCliente && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-playfair text-[#D4AF37]">Bloquear Cliente</h3>
              <button
                onClick={() => {
                  setShowBloquearModal(false);
                  setMotivoBloqueo('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 mb-2">Cliente: <span className="text-white font-semibold">{selectedCliente.nombre}</span></p>
              <p className="text-gray-400 mb-2">Teléfono: <span className="text-white">{selectedCliente.telefono}</span></p>
              <p className="text-gray-400 mb-2">No-Shows: <span className="text-yellow-500 font-semibold">{selectedCliente.totalNoShows || 0}</span></p>
              {(selectedCliente.multasPendientes || 0) > 0 && (
                <p className="text-gray-400 mb-2">Multas pendientes: <span className="text-orange-500 font-semibold">${selectedCliente.multasPendientes?.toLocaleString()}</span></p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Motivo del bloqueo *</label>
              <textarea
                value={motivoBloqueo}
                onChange={(e) => setMotivoBloqueo(e.target.value)}
                placeholder="Especifica el motivo del bloqueo..."
                rows={4}
                className="w-full px-4 py-2 bg-black border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#D4AF37] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBloquearModal(false);
                  setMotivoBloqueo('');
                }}
                className="flex-1 px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarBloqueo}
                disabled={!motivoBloqueo.trim()}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de historial */}
      {showHistorialModal && selectedCliente && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-playfair text-[#D4AF37]">Historial de Servicios</h3>
                <p className="text-gray-400">{selectedCliente.nombre} - {selectedCliente.telefono}</p>
              </div>
              <button
                onClick={() => setShowHistorialModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Estadísticas del cliente */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-black p-4 rounded-lg border border-[#2A2A2A]">
                <p className="text-gray-400 text-sm mb-1">Total Servicios</p>
                <p className="text-2xl font-bold text-white">{obtenerServiciosPorCliente(selectedCliente.id).length}</p>
              </div>
              <div className="bg-black p-4 rounded-lg border border-[#2A2A2A]">
                <p className="text-gray-400 text-sm mb-1">No-Shows</p>
                <p className="text-2xl font-bold text-yellow-500">{contarNoShowsCliente(selectedCliente.id)}</p>
              </div>
              <div className="bg-black p-4 rounded-lg border border-[#2A2A2A]">
                <p className="text-gray-400 text-sm mb-1">Completados</p>
                <p className="text-2xl font-bold text-green-500">
                  {obtenerServiciosPorCliente(selectedCliente.id).filter(s => s.estado === 'completado').length}
                </p>
              </div>
            </div>

            {/* Lista de servicios */}
            <div className="space-y-3">
              {obtenerServiciosPorCliente(selectedCliente.id).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay servicios registrados para este cliente</p>
                </div>
              ) : (
                obtenerServiciosPorCliente(selectedCliente.id)
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  .map((servicio) => (
                    <div key={servicio.id} className="bg-black p-4 rounded-lg border border-[#2A2A2A]">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-white font-semibold">{new Date(servicio.fecha).toLocaleDateString()}</span>
                            <span className="text-gray-400">•</span>
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">{servicio.hora}</span>
                          </div>
                          <p className="text-gray-400 text-sm">Modelo: <span className="text-white">{servicio.modeloNombre}</span></p>
                          <p className="text-gray-400 text-sm">Servicio: <span className="text-white">{servicio.tipoServicio} - {servicio.duracionEstimadaMinutos} min</span></p>
                          <p className="text-gray-400 text-sm">Monto: <span className="text-[#D4AF37] font-semibold">${servicio.montoPactado.toLocaleString()}</span></p>
                        </div>
                        <div className="text-right">
                          {servicio.estado === 'completado' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completado
                            </span>
                          )}
                          {servicio.estado === 'no_show' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-500">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              No-Show
                            </span>
                          )}
                          {servicio.estado === 'cancelado' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-500">
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancelado
                            </span>
                          )}
                          {servicio.multaAplicada && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-500">
                                <DollarSign className="w-3 h-3 mr-1" />
                                Multa: ${servicio.montoMulta?.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {servicio.notasPreServicio && (
                        <div className="mt-2 pt-2 border-t border-[#2A2A2A]">
                          <p className="text-gray-400 text-sm">Notas: <span className="text-white">{servicio.notasPreServicio}</span></p>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowHistorialModal(false)}
                className="w-full px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de multas */}
      {showMultasModal && selectedCliente && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-playfair text-[#D4AF37]">Multas Pendientes</h3>
                <p className="text-gray-400">{selectedCliente.nombre} - {selectedCliente.telefono}</p>
              </div>
              <button
                onClick={() => setShowMultasModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Total de multas */}
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-6 rounded-lg border border-orange-500/30 mb-6">
              <p className="text-gray-400 text-sm mb-1">Total Multas Pendientes</p>
              <p className="text-4xl font-bold text-orange-500">${calcularTotalMultasCliente(selectedCliente.id).toLocaleString()}</p>
            </div>

            {/* Lista de multas */}
            <div className="space-y-3">
              {obtenerMultasPendientesCliente(selectedCliente.id).map((servicio) => (
                <div key={servicio.id} className="bg-black p-4 rounded-lg border border-[#2A2A2A]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-white font-semibold">{new Date(servicio.fecha).toLocaleDateString()}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-400">{servicio.hora}</span>
                      </div>
                      <p className="text-gray-400 text-sm">Modelo: <span className="text-white">{servicio.modeloNombre}</span></p>
                      <p className="text-gray-400 text-sm">Servicio: <span className="text-white">${servicio.montoPactado.toLocaleString()}</span></p>
                      <div className="mt-2 p-3 bg-orange-500/10 rounded border border-orange-500/30">
                        <p className="text-orange-500 font-semibold text-lg">Multa: ${servicio.montoMulta?.toLocaleString()}</p>
                        {servicio.motivoMulta && (
                          <p className="text-gray-400 text-sm mt-1">{servicio.motivoMulta}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handlePagarMulta(servicio.id)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marcar como Pagada
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowMultasModal(false)}
                className="w-full px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
