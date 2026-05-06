import { useEffect } from 'react';
import { useBalanceFinanciero } from './BalanceFinancieroContext';
import { Wallet, Calendar, Clock, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const TarjetaBalance = ({ titulo, ingresos, egresos, balance, icon: Icon, color }: any) => (
  <Card className="bg-[#1a1a2e]/50 border-primary/20 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 group">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-primary/80 group-hover:text-primary transition-colors">
        {titulo}
      </CardTitle>
      <div className={`p-2 rounded-lg bg-${color}-500/10`}>
        <Icon className={`w-4 h-4 text-${color}-500`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white tracking-tight">
            ${(balance ?? 0).toLocaleString('es-CO')}
          </span>
          <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Balance Neto
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Ingresos</span>
            <div className="flex items-center text-emerald-400 font-bold text-sm">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              ${(ingresos ?? 0).toLocaleString('es-CO')}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Egresos</span>
            <div className="flex items-center text-rose-400 font-bold text-sm">
              <ArrowDownRight className="w-3 h-3 mr-1" />
              ${(egresos ?? 0).toLocaleString('es-CO')}
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const BalanceDashboard = () => {
  const {
    totalIngresos, totalEgresos, balanceNeto,
    ingresosHoy, egresosHoy, balanceHoy,
    ingresosMes, egresosMes, balanceMes,
    movimientos, cargando, recargar
  } = useBalanceFinanciero();

  useEffect(() => {
    recargar();
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary font-playfair">Balance Financiero</h2>
        <p className="text-muted-foreground">Monitoreo de ingresos y egresos en tiempo real.</p>
      </div>
      
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TarjetaBalance
          titulo="Hoy"
          ingresos={ingresosHoy}
          egresos={egresosHoy}
          balance={balanceHoy}
          icon={Clock}
          color="primary"
        />
        <TarjetaBalance
          titulo="Este Mes"
          ingresos={ingresosMes}
          egresos={egresosMes}
          balance={balanceMes}
          icon={Calendar}
          color="primary"
        />
        <TarjetaBalance
          titulo="Total Histórico"
          ingresos={totalIngresos}
          egresos={totalEgresos}
          balance={balanceNeto}
          icon={Wallet}
          color="primary"
        />
      </div>

      {/* Tabla de movimientos */}
      <Card className="bg-[#1a1a2e]/50 border-primary/20 backdrop-blur-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-black/20">
          <CardTitle className="text-lg font-semibold text-primary">Movimientos en Tiempo Real</CardTitle>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">En Vivo</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-black/40 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha / Hora</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Concepto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No hay movimientos registrados.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((mov) => (
                    <tr key={mov.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {new Date(mov.created_at).toLocaleDateString('es-CO')}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(mov.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors capitalize">
                          {mov.concepto}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 capitalize">
                          {mov.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`text-sm font-bold ${mov.tipo === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {mov.tipo === 'ingreso' ? '+' : '-'}
                          ${(mov.monto ?? 0).toLocaleString('es-CO')}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
