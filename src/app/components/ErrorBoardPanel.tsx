import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/info';
import { toast } from 'sonner';

interface ErrorLog {
  id: string;
  tipo: 'critico' | 'advertencia' | 'info';
  categoria: string;
  mensaje: string;
  detalle?: string;
  archivo?: string;
  linea?: number;
  usuario_email?: string;
  rol?: string;
  stack?: string;
  user_agent?: string;
  url?: string;
  resuelto: boolean;
  created_at: string;
}

export function ErrorBoardPanel() {
  const [errores, setErrores] = useState<ErrorLog[]>([]);
  const [filtro, setFiltro] = useState<'todos' | 'critico' | 'advertencia' | 'no_resueltos'>('no_resueltos');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarErrores();
    const unsub = suscribirRealtime();
    return () => { unsub(); };
  }, []);

  const cargarErrores = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data) setErrores(data as ErrorLog[]);
    setCargando(false);
  };

  const suscribirRealtime = () => {
    const channel = supabase
      .channel('error_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'error_logs' },
        (payload) => {
          const nuevo = payload.new as ErrorLog;
          setErrores(prev => [nuevo, ...prev]);
          if (nuevo.tipo === 'critico') {
            toast.error(`🚨 Error crítico: ${nuevo.mensaje.slice(0, 80)}`, { duration: 8000 });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'error_logs' },
        (payload) => {
          const updated = payload.new as ErrorLog;
          setErrores(prev => prev.map(e => (e.id === updated.id ? updated : e)));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const marcarResuelto = async (id: string) => {
    const { error } = await supabase
      .from('error_logs')
      .update({ resuelto: true })
      .eq('id', id);

    if (!error) {
      setErrores(prev => prev.map(e => (e.id === id ? { ...e, resuelto: true } : e)));
      toast.success('Error marcado como resuelto');
    }
  };

  const marcarTodosResueltos = async () => {
    const ids = erroresFiltrados.filter(e => !e.resuelto).map(e => e.id);
    if (!ids.length) return;

    const { error } = await supabase
      .from('error_logs')
      .update({ resuelto: true })
      .in('id', ids);

    if (!error) {
      setErrores(prev => prev.map(e => (ids.includes(e.id) ? { ...e, resuelto: true } : e)));
      toast.success(`${ids.length} errores marcados como resueltos`);
    }
  };

  const erroresFiltrados = errores
    .filter(e => {
      if (filtro === 'critico') return e.tipo === 'critico';
      if (filtro === 'advertencia') return e.tipo === 'advertencia';
      if (filtro === 'no_resueltos') return !e.resuelto;
      return true;
    })
    .filter(e =>
      busqueda === '' ||
      e.mensaje?.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.categoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.usuario_email?.toLowerCase().includes(busqueda.toLowerCase())
    );

  const criticos = errores.filter(e => e.tipo === 'critico' && !e.resuelto).length;
  const advertencias = errores.filter(e => e.tipo === 'advertencia' && !e.resuelto).length;
  const resueltos = errores.filter(e => e.resuelto).length;

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f1014', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ color: '#c9a961', fontFamily: 'Playfair Display, serif', margin: 0, fontSize: '1.5rem' }}>
          🛡️ Error Board — Monitor del Sistema
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#22c55e', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
            Monitoreando en vivo
          </span>
          <button
            onClick={cargarErrores}
            style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #2a2a2a', backgroundColor: '#1a1a2e', color: '#e8e6e3', cursor: 'pointer', fontSize: '12px' }}
          >
            ↻ Recargar
          </button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>

        <div
          style={{ backgroundColor: criticos > 0 ? '#ef444420' : '#1a1a2e', border: `1px solid ${criticos > 0 ? '#ef4444' : '#2a2a2a'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer' }}
          onClick={() => setFiltro('critico')}
        >
          <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0' }}>ERRORES CRÍTICOS</p>
          <p style={{ color: criticos > 0 ? '#ef4444' : '#e8e6e3', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{criticos}</p>
        </div>

        <div
          style={{ backgroundColor: advertencias > 0 ? '#f59e0b20' : '#1a1a2e', border: `1px solid ${advertencias > 0 ? '#f59e0b' : '#2a2a2a'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer' }}
          onClick={() => setFiltro('advertencia')}
        >
          <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0' }}>ADVERTENCIAS</p>
          <p style={{ color: advertencias > 0 ? '#f59e0b' : '#e8e6e3', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{advertencias}</p>
        </div>

        <div
          style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', cursor: 'pointer' }}
          onClick={() => setFiltro('todos')}
        >
          <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0' }}>RESUELTOS</p>
          <p style={{ color: '#22c55e', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{resueltos}</p>
        </div>

        <div style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0' }}>TOTAL REGISTRADOS</p>
          <p style={{ color: '#e8e6e3', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{errores.length}</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {(['todos', 'no_resueltos', 'critico', 'advertencia'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '6px 16px', borderRadius: '20px',
              border: `1px solid ${filtro === f ? '#c9a961' : '#2a2a2a'}`,
              backgroundColor: filtro === f ? '#c9a96120' : 'transparent',
              color: filtro === f ? '#c9a961' : '#666',
              cursor: 'pointer', fontSize: '13px',
            }}
          >
            {f === 'no_resueltos' ? 'Sin resolver'
              : f === 'critico' ? '🔴 Críticos'
              : f === 'advertencia' ? '🟡 Advertencias'
              : '📋 Todos'}
          </button>
        ))}

        <input
          placeholder="Buscar por mensaje, categoría o usuario..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '6px 16px', borderRadius: '20px', border: '1px solid #2a2a2a', backgroundColor: '#1a1a2e', color: '#e8e6e3', outline: 'none', fontSize: '13px' }}
        />

        {erroresFiltrados.filter(e => !e.resuelto).length > 0 && (
          <button
            onClick={marcarTodosResueltos}
            style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid #22c55e', backgroundColor: 'transparent', color: '#22c55e', cursor: 'pointer', fontSize: '13px' }}
          >
            ✓ Resolver todos
          </button>
        )}
      </div>

      {/* Tabla de errores */}
      <div style={{ backgroundColor: '#1a1a2e', borderRadius: '12px', border: '1px solid #2a2a2a', overflow: 'hidden' }}>
        {cargando ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Cargando logs...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f1014' }}>
                {['TIPO', 'CATEGORÍA', 'MENSAJE', 'USUARIO', 'ARCHIVO', 'FECHA', 'ACCIÓN'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', color: '#666', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {erroresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#22c55e', fontSize: '14px' }}>
                    ✅ Sin errores pendientes
                  </td>
                </tr>
              ) : (
                erroresFiltrados.map(error => (
                  <tr key={error.id} style={{ borderBottom: '1px solid #0f1014', opacity: error.resuelto ? 0.5 : 1 }}>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                        backgroundColor: error.tipo === 'critico' ? '#ef444430' : error.tipo === 'advertencia' ? '#f59e0b30' : '#3b82f630',
                        color: error.tipo === 'critico' ? '#ef4444' : error.tipo === 'advertencia' ? '#f59e0b' : '#3b82f6',
                      }}>
                        {error.tipo === 'critico' ? '🔴 CRÍTICO' : error.tipo === 'advertencia' ? '🟡 AVISO' : '🔵 INFO'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#c9a961', fontSize: '12px' }}>{error.categoria}</td>
                    <td style={{ padding: '10px 16px', color: '#e8e6e3', fontSize: '12px', maxWidth: '300px' }}>
                      <span title={error.mensaje}>
                        {error.mensaje?.slice(0, 80)}{(error.mensaje?.length ?? 0) > 80 ? '...' : ''}
                      </span>
                      {error.stack && (
                        <details style={{ marginTop: '4px' }}>
                          <summary style={{ color: '#666', fontSize: '11px', cursor: 'pointer' }}>Ver stack trace</summary>
                          <pre style={{ fontSize: '10px', color: '#ef4444', backgroundColor: '#0f1014', padding: '8px', borderRadius: '4px', overflow: 'auto', maxHeight: '150px', marginTop: '4px' }}>
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#666', fontSize: '12px' }}>
                      <div>{error.usuario_email ?? 'Anónimo'}</div>
                      {error.rol && <div style={{ color: '#c9a961', fontSize: '11px' }}>{error.rol}</div>}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#666', fontSize: '11px' }}>
                      {error.archivo?.split('/').pop()}{error.linea ? `:${error.linea}` : ''}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#666', fontSize: '11px' }}>
                      {new Date(error.created_at).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {!error.resuelto ? (
                        <button
                          onClick={() => marcarResuelto(error.id)}
                          style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #22c55e', backgroundColor: 'transparent', color: '#22c55e', cursor: 'pointer', fontSize: '11px' }}
                        >
                          ✓ Resolver
                        </button>
                      ) : (
                        <span style={{ color: '#22c55e', fontSize: '11px' }}>✅ Resuelto</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
