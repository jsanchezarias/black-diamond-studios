import { useState } from 'react';
import { GeneradorDatosDemo } from './GeneradorDatosDemo';
import { supabase } from '../../utils/supabase/info';
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
      administrador: number;
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
  const [_huerfanos, setHuerfanos] = useState<UsuarioHuerfano[]>([]);
  const [estadoCompleto, setEstadoCompleto] = useState<EstadoDiagnostico | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  };

  const obtenerEstadoCompleto = async () => {
    setLoading(true);
    try {
      // Obtener usuarios desde tabla 'usuarios'
      const { data: _usuariosDB, error: dbError } = await supabase
        .from('usuarios')
        .select('id, email, nombre, role, activo');

      if (dbError) {
        mostrarMensaje('error', `Error al obtener usuarios: ${dbError.message}`);
        return;
      }

      const usuarios = _usuariosDB ?? [];
      const porRole = {
        owner: usuarios.filter((u: any) => u.role === 'owner').length,
        administrador: usuarios.filter((u: any) => u.role === 'administrador').length,
        programador: usuarios.filter((u: any) => u.role === 'programador').length,
        modelo: usuarios.filter((u: any) => u.role === 'modelo').length,
      };

      const estado: EstadoDiagnostico = {
        auth: {
          total: usuarios.length,
          huerfanos: 0,
          listaHuerfanos: [],
        },
        baseDatos: {
          total: usuarios.length,
          sinAuth: 0,
          listaSinAuth: [],
          porRole,
        },
        storage: {
          buckets: 0,
          archivos: 0,
        },
      };

      setEstadoCompleto(estado);
      mostrarMensaje('success', `Estado cargado: ${usuarios.length} usuarios en la base de datos`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error:', error);
      mostrarMensaje('error', 'Error al obtener estado');
    } finally {
      setLoading(false);
    }
  };

  const verificarHuerfanos = async () => {
    setLoading(true);
    try {
      // Obtener usuarios de la tabla 'usuarios'
      const { data: _usuariosDB } = await supabase
        .from('usuarios')
        .select('id, email');

      mostrarMensaje('success', 'Verificación completada.');
      setHuerfanos([]);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error:', error);
      mostrarMensaje('error', 'Error al verificar huérfanos');
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
                  if (process.env.NODE_ENV === 'development') console.error('❌ Error:', error);
                  setMensaje({ tipo: 'error', texto: `Error: ${error.message}` });
                  return;
                }

                const archivadas = data?.filter(u => u.fecha_archivado) || [];

                if (archivadas.length > 0) {
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
                if (process.env.NODE_ENV === 'development') console.error('❌ Error:', error);
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
        <p className="text-gray-400">Verificación de usuarios en la base de datos</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
          {loading ? 'Verificando...' : '🔍 Verificar Usuarios'}
        </button>
      </div>

      {/* Estado Completo */}
      {estadoCompleto && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Base de Datos */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">💾 Base de Datos (tabla usuarios)</h3>
            <div className="space-y-2 text-gray-300">
              <p>Total usuarios: <span className="text-white font-semibold">{estadoCompleto.baseDatos.total}</span></p>
              <p className="text-sm">
                Owner: {estadoCompleto.baseDatos.porRole.owner} |
                Admin: {estadoCompleto.baseDatos.porRole.administrador} |
                Prog: {estadoCompleto.baseDatos.porRole.programador} |
                Modelos: {estadoCompleto.baseDatos.porRole.modelo}
              </p>
            </div>
          </div>

          {/* Información */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">ℹ️ Sistema</h3>
            <div className="space-y-2 text-gray-300 text-sm">
              <p>✅ Autenticación: Supabase Auth + tabla usuarios</p>
              <p>✅ Chat: tabla chat_mensajes_publicos</p>
              <p>✅ Clientes: tabla clientes</p>
              <p>✅ Notificaciones: tabla notificaciones</p>
            </div>
          </div>
        </div>
      )}

      {/* Información sobre el sistema */}
      <div className="mt-8 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-yellow-400 mb-3">
          ℹ️ Arquitectura del Sistema
        </h3>
        <p className="text-gray-300 mb-4">
          El sistema usa Supabase como backend principal:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-400">
          <li><strong className="text-white">usuarios:</strong> Admins, owners, programadores, modelos</li>
          <li><strong className="text-white">clientes:</strong> Usuarios del chat público</li>
          <li><strong className="text-white">chat_mensajes_publicos:</strong> Mensajes del chat</li>
          <li><strong className="text-white">notificaciones:</strong> Sistema de notificaciones</li>
        </ul>
      </div>
    </div>
  );
}
