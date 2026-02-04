import React, { useState } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { GeneradorDatosDemo } from './GeneradorDatosDemo';
import { supabase } from '../../lib/supabaseClient';
import { Archive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface UsuarioHuerfano {
  id: string;
  email: string;
  created_at: string;
  metadata: any;
}

interface EstadoDiagnostico {
  auth: {
    total: number;
    huerfanos: number;
    listaHuerfanos: { email: string; id: string }[];
  };
  baseDatos: {
    total: number;
    sinAuth: number;
    listaSinAuth: { email: string; id: string; nombre: string; role: string }[];
    porRole: {
      owner: number;
      admin: number;
      programador: number;
      modelo: number;
    };
  };
  storage: {
    buckets: number;
    archivos: number;
  };
}

export function DiagnosticoPanel() {
  const [loading, setLoading] = useState(false);
  const [huerfanos, setHuerfanos] = useState<UsuarioHuerfano[]>([]);
  const [estadoCompleto, setEstadoCompleto] = useState<EstadoDiagnostico | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  };

  const verificarHuerfanos = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/diagnostico/usuarios-huerfanos`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setHuerfanos(data.huerfanos);
        mostrarMensaje('success', `Se encontraron ${data.totalHuerfanos} usuarios huérfanos`);
        console.log('📊 Huérfanos encontrados:', data);
      } else {
        mostrarMensaje('error', `Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al verificar huérfanos');
    } finally {
      setLoading(false);
    }
  };

  const limpiarHuerfanos = async () => {
    if (!confirm('¿Estás seguro de eliminar todos los usuarios huérfanos de Auth?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/diagnostico/limpiar-huerfanos`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        mostrarMensaje('success', `✅ ${data.eliminados} usuarios eliminados`);
        console.log('🧹 Resultados:', data.resultados);
        setHuerfanos([]);
        // Actualizar estado completo
        obtenerEstadoCompleto();
      } else {
        mostrarMensaje('error', `Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al limpiar huérfanos');
    } finally {
      setLoading(false);
    }
  };

  const obtenerEstadoCompleto = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/diagnostico/estado-completo`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setEstadoCompleto(data);
        setHuerfanos(data.auth.listaHuerfanos.map((h: any) => ({ 
          id: h.id, 
          email: h.email, 
          created_at: '',
          metadata: {} 
        })));
        mostrarMensaje('success', 'Estado de Supabase cargado correctamente');
        console.log('🔍 Estado completo:', data);
      } else {
        mostrarMensaje('error', `Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al obtener estado');
    } finally {
      setLoading(false);
    }
  };

  const recrearAuth = async () => {
    if (!estadoCompleto || estadoCompleto.baseDatos.sinAuth === 0) {
      mostrarMensaje('error', 'No hay usuarios sin Auth para recrear');
      return;
    }

    const confirmar = confirm(
      `⚠️ ADVERTENCIA: Esto recreará ${estadoCompleto.baseDatos.sinAuth} usuarios en Auth.\n\n` +
      `Los usuarios podrán iniciar sesión con:\n` +
      `- Email: Su email actual\n` +
      `- Contraseña: BlackDiamond2024!\n\n` +
      `¿Continuar?`
    );

    if (!confirmar) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/diagnostico/recrear-auth-desde-bd`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        mostrarMensaje('success', `✅ ${data.recreados} usuarios recreados con contraseña: ${data.passwordTemporal}`);
        console.log('🔄 Resultados:', data.resultados);
        console.log('⚠️ Contraseña temporal:', data.passwordTemporal);
        // Actualizar estado completo
        obtenerEstadoCompleto();
      } else {
        mostrarMensaje('error', `Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al recrear usuarios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🔍 Diagnóstico & Herramientas</h1>
        <p className="text-gray-400">Herramientas para diagnosticar, generar datos demo y limpiar el sistema</p>
      </div>

      {/* Generador de Datos Demo */}
      <GeneradorDatosDemo />

      {/* Separador */}
      <div className="border-t border-gray-700 my-8"></div>

      {/* 📦 VERIFICACIÓN DE MODELOS ARCHIVADAS */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Verificar Modelos Archivadas
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Consulta directa a Supabase para verificar modelos con fecha_archivado
          </p>
        </CardHeader>
        <CardContent>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                const { data, error } = await supabase
                  .from('usuarios')
                  .select('email, nombreArtistico, fecha_archivado, motivo_archivo, estado')
                  .eq('role', 'modelo');

                if (error) {
                  console.error('❌ Error:', error);
                  setMensaje({ tipo: 'error', texto: `Error: ${error.message}` });
                  return;
                }

                const archivadas = data?.filter(u => u.fecha_archivado) || [];
                
                console.log('📊 MODELOS EN BD:', data?.length || 0);
                console.log('📦 MODELOS ARCHIVADAS:', archivadas.length);
                
                if (archivadas.length > 0) {
                  console.table(archivadas.map(m => ({
                    Email: m.email,
                    Nombre: m.nombreArtistico || 'N/A',
                    Estado: m.estado,
                    FechaArchivado: m.fecha_archivado,
                    Motivo: m.motivo_archivo
                  })));
                  
                  setMensaje({
                    tipo: 'success',
                    texto: `✅ Encontradas ${archivadas.length} modelos archivadas. Ver consola para detalles.`
                  });
                } else {
                  setMensaje({
                    tipo: 'success',
                    texto: '✅ No hay modelos archivadas en Supabase'
                  });
                }
              } catch (error) {
                console.error('❌ Error:', error);
                setMensaje({ tipo: 'error', texto: 'Error al consultar BD' });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full md:w-auto"
          >
            {loading ? 'Consultando...' : '📦 Verificar Archivadas en Supabase'}
          </button>
        </CardContent>
      </Card>

      {/* Separador */}
      <div className="border-t border-gray-700 my-8"></div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Diagnóstico de Usuarios</h2>
        <p className="text-gray-400">Verificación y limpieza de usuarios huérfanos</p>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-green-900/20 border border-green-500/30 text-green-400' : 'bg-red-900/20 border border-red-500/30 text-red-400'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Botones de acción */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={obtenerEstadoCompleto}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {loading ? 'Cargando...' : '📊 Ver Estado Completo'}
        </button>

        <button
          onClick={verificarHuerfanos}
          disabled={loading}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {loading ? 'Verificando...' : '🔍 Verificar Huérfanos'}
        </button>

        <button
          onClick={limpiarHuerfanos}
          disabled={loading || huerfanos.length === 0}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {loading ? 'Limpiando...' : '🧹 Limpiar Huérfanos'}
        </button>
      </div>

      {/* Estado Completo */}
      {estadoCompleto && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Auth */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">🔐 Auth</h3>
            <div className="space-y-2 text-gray-300">
              <p>Total usuarios: <span className="text-white font-semibold">{estadoCompleto.auth.total}</span></p>
              <p className={estadoCompleto.auth.huerfanos > 0 ? 'text-red-400 font-semibold' : ''}>
                Huérfanos: <span className="text-white">{estadoCompleto.auth.huerfanos}</span>
              </p>
            </div>
          </div>

          {/* Base de Datos */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">💾 Base de Datos</h3>
            <div className="space-y-2 text-gray-300">
              <p>Total usuarios: <span className="text-white font-semibold">{estadoCompleto.baseDatos.total}</span></p>
              <p className={estadoCompleto.baseDatos.sinAuth > 0 ? 'text-red-400 font-semibold' : ''}>
                Sin Auth: <span className="text-white">{estadoCompleto.baseDatos.sinAuth}</span>
              </p>
              <p className="text-sm">
                Owner: {estadoCompleto.baseDatos.porRole.owner} | 
                Admin: {estadoCompleto.baseDatos.porRole.admin} | 
                Prog: {estadoCompleto.baseDatos.porRole.programador} | 
                Modelos: {estadoCompleto.baseDatos.porRole.modelo}
              </p>
            </div>
          </div>

          {/* Storage */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">📦 Storage</h3>
            <div className="space-y-2 text-gray-300">
              <p>Buckets: <span className="text-white font-semibold">{estadoCompleto.storage.buckets}</span></p>
              <p>Archivos: <span className="text-white font-semibold">{estadoCompleto.storage.archivos}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Huérfanos */}
      {huerfanos.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-8">
          <div className="bg-red-900/20 border-b border-red-500/30 px-6 py-4">
            <h3 className="text-xl font-semibold text-red-400">
              ⚠️ Usuarios Huérfanos ({huerfanos.length})
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Estos usuarios existen en Auth pero NO en la tabla usuarios
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {huerfanos.map((huerfano) => (
                  <tr key={huerfano.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 text-sm text-white">{huerfano.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">{huerfano.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lista de Usuarios Sin Auth - PROBLEMA CRÍTICO */}
      {estadoCompleto && estadoCompleto.baseDatos.sinAuth > 0 && (
        <div className="bg-gray-800 rounded-lg border border-red-600 overflow-hidden mb-8">
          <div className="bg-red-900/30 border-b border-red-500/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-red-400">
                  🚨 PROBLEMA CRÍTICO: Usuarios Sin Auth ({estadoCompleto.baseDatos.sinAuth})
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  Estos usuarios existen en la Base de Datos pero NO tienen cuenta de Auth (no pueden iniciar sesión)
                </p>
              </div>
              <button
                onClick={recrearAuth}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ml-4"
              >
                {loading ? 'Recreando...' : '🔄 Recrear Auth'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID (BD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {estadoCompleto.baseDatos.listaSinAuth.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 text-sm text-white">{usuario.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{usuario.nombre}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        usuario.role === 'owner' ? 'bg-purple-900/30 text-purple-400' :
                        usuario.role === 'admin' ? 'bg-blue-900/30 text-blue-400' :
                        usuario.role === 'modelo' ? 'bg-pink-900/30 text-pink-400' :
                        'bg-gray-900/30 text-gray-400'
                      }`}>
                        {usuario.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono text-xs">{usuario.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-red-900/20 px-6 py-4 border-t border-red-500/30">
            <p className="text-yellow-400 text-sm font-semibold">
              ⚠️ Al hacer clic en "Recrear Auth", se crearán cuentas de autenticación para estos usuarios.
            </p>
            <p className="text-gray-400 text-xs mt-2">
              • Todos recibirán la contraseña temporal: <strong className="text-white">BlackDiamond2024!</strong><br/>
              • Los IDs en la BD se actualizarán para coincidir con los nuevos IDs de Auth<br/>
              • Deberán cambiar su contraseña al iniciar sesión
            </p>
          </div>
        </div>
      )}

      {/* Información sobre KV Store */}
      <div className="mt-8 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-yellow-400 mb-3">
          ⚠️ Datos en KV Store (archivos locales)
        </h3>
        <p className="text-gray-300 mb-4">
          Actualmente estos datos están en el KV store local en lugar de Supabase Postgres:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-400">
          <li><strong className="text-white">Clientes:</strong> Deberían migrar a tabla `clientes` en Postgres</li>
          <li><strong className="text-white">Streaming:</strong> Deberían migrar a tabla `sesiones_streaming` en Postgres</li>
        </ul>
        <p className="text-sm text-gray-500 mt-4">
          ℹ️ Para migrar estos datos a Supabase, necesitarías crear las tablas correspondientes en Postgres.
        </p>
      </div>
    </div>
  );
}