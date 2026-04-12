import { useEffect, useState } from 'react';
import { useClientes } from './ClientesContext';
import { useServicios } from './ServiciosContext';
import { AlertTriangle, Ban, DollarSign, X } from 'lucide-react';

interface ClienteStatusCheckerProps {
  clienteId: string;
  onBlock?: () => void; // Callback cuando el cliente está bloqueado
}

export function ClienteStatusChecker({ clienteId, onBlock }: ClienteStatusCheckerProps) {
  const { clientes } = useClientes();
  const { contarNoShowsCliente, calcularTotalMultasCliente, politicaPenalizacion } = useServicios();
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
  const [mostrarBloqueado, setMostrarBloqueado] = useState(false);

  const cliente = clientes.find(c => c.id === clienteId);
  const totalNoShows = contarNoShowsCliente(clienteId);
  const multasPendientes = calcularTotalMultasCliente(clienteId);

  useEffect(() => {
    if (!cliente) return;

    // Cliente bloqueado
    if (cliente.bloqueado) {
      setMostrarBloqueado(true);
      if (onBlock) onBlock();
      return;
    }

    // Cliente con advertencias
    if (totalNoShows > 0 || multasPendientes > 0) {
      setMostrarAdvertencia(true);
    }
  }, [cliente, totalNoShows, multasPendientes]);

  if (!cliente) return null;

  return (
    <>
      {/* Modal de cliente bloqueado */}
      {mostrarBloqueado && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-red-900/50 to-black rounded-lg border-2 border-red-500 p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Ban className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-playfair text-red-500 mb-2">Cliente Bloqueado</h3>
              <p className="text-gray-300 mb-4">
                Este cliente ha sido bloqueado y no puede realizar reservas en este momento.
              </p>
              
              {cliente.motivoBloqueo && (
                <div className="bg-black/50 p-4 rounded-lg border border-red-500/30 mb-4">
                  <p className="text-sm text-gray-400 mb-1">Motivo:</p>
                  <p className="text-white">{cliente.motivoBloqueo}</p>
                </div>
              )}

              {cliente.fechaBloqueo && (
                <p className="text-sm text-gray-500 mb-6">
                  Bloqueado el {new Date(cliente.fechaBloqueo).toLocaleDateString()}
                </p>
              )}

              <p className="text-sm text-gray-400 mb-6">
                Para más información, contacta al administrador.
              </p>

              <button
                onClick={() => {
                  setMostrarBloqueado(false);
                  if (onBlock) onBlock();
                }}
                className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advertencia de no-shows y multas */}
      {mostrarAdvertencia && !mostrarBloqueado && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <h4 className="font-semibold text-yellow-500">Advertencias del Cliente</h4>
              </div>
              
              <div className="space-y-2">
                {totalNoShows > 0 && (
                  <div className="flex items-center justify-between p-3 bg-black/30 rounded">
                    <div>
                      <p className="text-sm text-white font-medium">No-Shows Registrados</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {totalNoShows >= politicaPenalizacion.noShowsParaBloqueo ? (
                          <span className="text-red-500">⚠️ Cliente en riesgo de bloqueo</span>
                        ) : totalNoShows >= politicaPenalizacion.noShowsParaMulta ? (
                          <span className="text-yellow-500">Multas aplicadas automáticamente</span>
                        ) : (
                          <span className="text-gray-400">Próximo no-show aplicará multa</span>
                        )}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-yellow-500">{totalNoShows}</span>
                  </div>
                )}

                {multasPendientes > 0 && (
                  <div className="flex items-center justify-between p-3 bg-black/30 rounded">
                    <div>
                      <p className="text-sm text-white font-medium">Multas Pendientes</p>
                      <p className="text-xs text-orange-500 mt-1">Requiere pago</p>
                    </div>
                    <div className="flex items-center gap-1 text-orange-500">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-2xl font-bold">${multasPendientes.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3">
                💡 Se recomienda verificar el pago de multas antes de confirmar la reserva.
              </p>
            </div>

            <button
              onClick={() => setMostrarAdvertencia(false)}
              className="text-gray-400 hover:text-white ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
