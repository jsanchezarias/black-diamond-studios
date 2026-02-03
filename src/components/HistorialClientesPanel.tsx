import { useState } from 'react';
import { Search, User, Calendar, DollarSign, TrendingUp, Phone, Clock, ArrowLeft, Star, MapPin, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useClientes, Cliente, ServicioCliente } from '../src/app/components/ClientesContext';
import { AgregarClienteModal } from './AgregarClienteModal';

export function HistorialClientesPanel() {
  const { clientes, buscarClientes } = useClientes();
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarAgregarCliente, setMostrarAgregarCliente] = useState(false);

  // Filtrar clientes según búsqueda
  const clientesFiltrados = busqueda.trim() 
    ? buscarClientes(busqueda)
    : clientes;

  // Ordenar clientes por última visita (más reciente primero)
  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => 
    new Date(b.ultimaVisita).getTime() - new Date(a.ultimaVisita).getTime()
  );

  // Calcular estadísticas del cliente seleccionado
  const calcularEstadisticas = (cliente: Cliente) => {
    if (!cliente.historialServicios.length) {
      return {
        modeloFavorita: 'N/A',
        tipoServicioFavorito: 'N/A',
        metodoPagoFavorito: 'N/A',
        gastoPromedio: 0,
        duracionPromedio: 0,
      };
    }

    // Modelo favorita (más servicios con ella)
    const modeloCounts = cliente.historialServicios.reduce((acc, s) => {
      acc[s.modeloNombre] = (acc[s.modeloNombre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const modeloFavorita = Object.entries(modeloCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Tipo de servicio favorito
    const tipoCounts = cliente.historialServicios.reduce((acc, s) => {
      acc[s.tipoServicio] = (acc[s.tipoServicio] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const tipoServicioFavorito = Object.entries(tipoCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Método de pago favorito
    const metodoCounts = cliente.historialServicios.reduce((acc, s) => {
      acc[s.metodoPago] = (acc[s.metodoPago] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const metodoPagoFavorito = Object.entries(metodoCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Gasto promedio
    const gastoPromedio = cliente.totalGastado / cliente.totalServicios;

    // Duración promedio
    const duracionTotal = cliente.historialServicios.reduce((sum, s) => sum + s.duracionMinutos, 0);
    const duracionPromedio = duracionTotal / cliente.historialServicios.length;

    return {
      modeloFavorita,
      tipoServicioFavorito,
      metodoPagoFavorito,
      gastoPromedio,
      duracionPromedio,
    };
  };

  // Vista de lista de clientes
  if (!clienteSeleccionado) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Historial de Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza el historial completo de {clientes.length} clientes
          </p>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clientes.length}</p>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clientes.reduce((sum, c) => sum + c.totalServicios, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Servicios</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${clientes.reduce((sum, c) => sum + c.totalGastado, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${Math.round(
                    clientes.reduce((sum, c) => sum + c.totalGastado, 0) / 
                    Math.max(clientes.reduce((sum, c) => sum + c.totalServicios, 0), 1)
                  ).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Ticket Promedio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-primary">Clientes Registrados</h2>
          
          {clientesOrdenados.length > 0 ? (
            <div className="space-y-2">
              {clientesOrdenados.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => setClienteSeleccionado(cliente)}
                  className="w-full p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg truncate">{cliente.nombre}</h3>
                          {cliente.totalServicios >= 10 && (
                            <Star className="w-4 h-4 text-primary fill-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{cliente.telefono}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Última visita: {new Date(cliente.ultimaVisita).toLocaleDateString('es')}</span>
                          </div>
                        </div>
                        {cliente.notas && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {cliente.notas}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="font-bold text-primary">
                          ${cliente.totalGastado.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {cliente.totalServicios} servicio{cliente.totalServicios !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-secondary/50 border border-border rounded-lg text-center">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                {busqueda ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </p>
            </div>
          )}
        </div>

        {/* Botón para agregar cliente */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {clientesOrdenados.length} cliente{clientesOrdenados.length !== 1 ? 's' : ''} encontrado{clientesOrdenados.length !== 1 ? 's' : ''}
          </p>
          <Button
            onClick={() => setMostrarAgregarCliente(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Cliente
          </Button>
        </div>

        {/* Modal para agregar cliente */}
        <AgregarClienteModal
          isOpen={mostrarAgregarCliente}
          onClose={() => setMostrarAgregarCliente(false)}
        />
      </div>
    );
  }

  // Vista detallada del cliente
  const estadisticas = calcularEstadisticas(clienteSeleccionado);

  return (
    <div className="space-y-6">
      {/* Header con botón de regreso */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setClienteSeleccionado(null)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">{clienteSeleccionado.nombre}</h1>
          <p className="text-muted-foreground">{clienteSeleccionado.telefono}</p>
        </div>
      </div>

      {/* Información General del Cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-primary/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Primera Visita</span>
          </div>
          <p className="text-xl font-bold">
            {new Date(clienteSeleccionado.fechaRegistro).toLocaleDateString('es')}
          </p>
        </div>

        <div className="p-4 bg-card border border-primary/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Última Visita</span>
          </div>
          <p className="text-xl font-bold">
            {new Date(clienteSeleccionado.ultimaVisita).toLocaleDateString('es')}
          </p>
        </div>

        <div className="p-4 bg-card border border-primary/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Total Servicios</span>
          </div>
          <p className="text-xl font-bold">{clienteSeleccionado.totalServicios}</p>
        </div>

        <div className="p-4 bg-card border border-primary/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Total Gastado</span>
          </div>
          <p className="text-xl font-bold text-primary">
            ${clienteSeleccionado.totalGastado.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Estadísticas Avanzadas */}
      <div className="p-6 bg-card border border-border rounded-lg">
        <h2 className="text-xl font-bold text-primary mb-4">Estadísticas del Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Modelo Favorita</span>
            </div>
            <p className="font-bold">{estadisticas.modeloFavorita}</p>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Tipo Favorito</span>
            </div>
            <p className="font-bold">{estadisticas.tipoServicioFavorito}</p>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Método de Pago Favorito</span>
            </div>
            <p className="font-bold">{estadisticas.metodoPagoFavorito}</p>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Gasto Promedio</span>
            </div>
            <p className="font-bold">${Math.round(estadisticas.gastoPromedio).toLocaleString()}</p>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Duración Promedio</span>
            </div>
            <p className="font-bold">{Math.round(estadisticas.duracionPromedio)} min</p>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Frecuencia</span>
            </div>
            <p className="font-bold">
              {clienteSeleccionado.totalServicios >= 10 ? 'VIP' : 
               clienteSeleccionado.totalServicios >= 5 ? 'Regular' : 'Ocasional'}
            </p>
          </div>
        </div>
      </div>

      {/* Notas del Cliente */}
      {clienteSeleccionado.notas && (
        <div className="p-4 bg-secondary/50 border border-border rounded-lg">
          <h3 className="font-bold mb-2">Notas</h3>
          <p className="text-muted-foreground">{clienteSeleccionado.notas}</p>
        </div>
      )}

      {/* Historial de Servicios */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-primary">
          Historial de Servicios ({clienteSeleccionado.historialServicios.length})
        </h2>

        {clienteSeleccionado.historialServicios.length > 0 ? (
          <div className="space-y-3">
            {clienteSeleccionado.historialServicios.map((servicio) => (
              <div
                key={servicio.id}
                className="p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-bold">
                        {new Date(servicio.fecha).toLocaleDateString('es', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(servicio.fecha).toLocaleTimeString('es', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Atendido por: <span className="text-foreground font-medium">{servicio.modeloNombre}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ${servicio.costoTotal.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{servicio.metodoPago}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-medium">{servicio.tipoServicio}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duración:</span>
                    <p className="font-medium">{servicio.tiempoServicio}</p>
                  </div>
                  {servicio.habitacion && (
                    <div>
                      <span className="text-muted-foreground">Habitación:</span>
                      <p className="font-medium">{servicio.habitacion}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Tiempo Real:</span>
                    <p className="font-medium">{servicio.duracionMinutos} min</p>
                  </div>
                </div>

                {/* Desglose de Costos */}
                <div className="p-3 bg-secondary/50 rounded-lg mb-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Servicio:</span>
                    <span className="font-medium">${servicio.costoServicio.toLocaleString()}</span>
                  </div>
                  {servicio.costoAdicionales > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adicionales:</span>
                      <span className="font-medium">${servicio.costoAdicionales.toLocaleString()}</span>
                    </div>
                  )}
                  {servicio.costoConsumo > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Consumo:</span>
                      <span className="font-medium">${servicio.costoConsumo.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Adicionales y Consumo */}
                {(servicio.adicionales || servicio.consumo) && (
                  <div className="space-y-2 text-sm mb-3">
                    {servicio.adicionales && (
                      <div>
                        <span className="text-muted-foreground">Adicionales: </span>
                        <span>{servicio.adicionales}</span>
                      </div>
                    )}
                    {servicio.consumo && (
                      <div>
                        <span className="text-muted-foreground">Consumo: </span>
                        <span>{servicio.consumo}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notas del Servicio */}
                {servicio.notasServicio && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Notas del servicio:</p>
                    <p className="text-sm">{servicio.notasServicio}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-secondary/50 border border-border rounded-lg text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No hay servicios registrados para este cliente</p>
          </div>
        )}
      </div>
    </div>
  );
}
