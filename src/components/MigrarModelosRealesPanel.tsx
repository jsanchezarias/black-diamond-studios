import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import { Download, Trash2, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { DebugModelosPanel } from './DebugModelosPanel';

// Datos de las modelos reales para mostrar en el panel
const modelosReales = [
  { id: 'annie-001', nombre: 'Annie', disponible: true },
  { id: 'luci-002', nombre: 'Luci', disponible: true },
  { id: 'isabella-003', nombre: 'Isabella', disponible: true },
  { id: 'natalia-004', nombre: 'Natalia', disponible: true },
  { id: 'ximena-005', nombre: 'Ximena', disponible: false },
  { id: 'xiomara-006', nombre: 'Xiomara', disponible: true },
  { id: 'roxxy-007', nombre: 'Roxxy', disponible: false }
];

export function MigrarModelosRealesPanel() {
  const [migrando, setMigrando] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [procesandoTodo, setProcesandoTodo] = useState(false);
  const [mostrarDebug, setMostrarDebug] = useState(false);
  const [actualizandoXimena, setActualizandoXimena] = useState(false);
  const [resultado, setResultado] = useState<{
    exitosas: number;
    fallidas: number;
    detalles: string[];
    eliminados?: number;
  } | null>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017`;

  const limpiarPerfilesDemo = async () => {
    try {
      setLimpiando(true);
      setResultado(null);
      
      const response = await fetch(`${serverUrl}/migration/limpiar-modelos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ ${data.eliminados} perfiles eliminados correctamente`);
        setResultado({
          exitosas: data.eliminados,
          fallidas: 0,
          detalles: data.detalles || []
        });
        
        // Esperar 2 segundos y recargar
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Error al limpiar perfiles');
        setResultado({
          exitosas: 0,
          fallidas: 1,
          detalles: [data.error || 'Error desconocido']
        });
      }
    } catch (error) {
      console.error('Error limpiando perfiles:', error);
      toast.error('Error al conectar con el servidor');
      setResultado({
        exitosas: 0,
        fallidas: 1,
        detalles: ['Error de conexión']
      });
    } finally {
      setLimpiando(false);
    }
  };

  const migrarModelos = async () => {
    try {
      setMigrando(true);
      setResultado(null);
      
      const response = await fetch(`${serverUrl}/migration/migrar-modelos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ ${data.resultado.exitosas} modelos migradas exitosamente!`);
        setResultado(data.resultado);
        
        // Esperar 2 segundos y recargar
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Error en la migración');
        setResultado(data.resultado);
      }
    } catch (error) {
      console.error('Error migrando modelos:', error);
      toast.error('Error al conectar con el servidor');
      setResultado({
        exitosas: 0,
        fallidas: 5,
        detalles: ['Error de conexión']
      });
    } finally {
      setMigrando(false);
    }
  };

  const procesarTodo = async () => {
    try {
      setProcesandoTodo(true);
      setResultado(null);
      
      toast.info('🚀 Iniciando migración completa...');
      
      const response = await fetch(`${serverUrl}/migration/migrar-todo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Migración completa: ${data.resultado.eliminados} eliminadas, ${data.resultado.exitosas} migradas!`);
        setResultado(data.resultado);
        
        // Esperar 3 segundos y recargar
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        toast.error('Error en la migración completa');
        setResultado(data.resultado);
      }
    } catch (error) {
      console.error('Error en migración completa:', error);
      toast.error('Error al conectar con el servidor');
      setResultado({
        exitosas: 0,
        fallidas: 5,
        detalles: ['Error de conexión'],
        eliminados: 0
      });
    } finally {
      setProcesandoTodo(false);
    }
  };

  const actualizarXimena = async () => {
    try {
      setActualizandoXimena(true);
      
      const response = await fetch(`${serverUrl}/migration/actualizar-ximena`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Ximena actualizada: disponible=false');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(data.error || 'Error actualizando Ximena');
      }
    } catch (error) {
      console.error('Error actualizando Ximena:', error);
      toast.error('Error al conectar con el servidor');
    } finally {
      setActualizandoXimena(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Migración de Modelos Reales
        </CardTitle>
        <CardDescription>
          Importa las modelos reales de la página web a Supabase y elimina perfiles demo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            Proceso de Migración
          </h4>
          <ol className="text-sm space-y-1 ml-6 list-decimal text-muted-foreground">
            <li>Primero: Limpia todos los perfiles demo actuales en Supabase</li>
            <li>Segundo: Importa las 5 modelos reales de la página web</li>
            <li>Resultado: Una única fuente de verdad en Supabase</li>
          </ol>
        </div>

        {/* Modelos a migrar */}
        <div>
          <h4 className="font-semibold mb-3">Modelos a Migrar ({modelosReales.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {modelosReales.map((modelo) => (
              <Badge 
                key={modelo.id} 
                variant="outline" 
                className={`justify-start ${
                  !modelo.disponible ? 'border-orange-500/50 text-orange-400' : ''
                }`}
              >
                {modelo.nombre}
                {!modelo.disponible && ' 🚫'}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            🚫 = No disponible temporalmente
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={limpiarPerfilesDemo}
            disabled={limpiando || migrando || procesandoTodo}
            variant="destructive"
            className="flex-1"
          >
            {limpiando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Limpiando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                1. Limpiar Perfiles Demo
              </>
            )}
          </Button>

          <Button
            onClick={migrarModelos}
            disabled={migrando || limpiando || procesandoTodo}
            className="flex-1 bg-primary"
          >
            {migrando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Migrando {modelosReales.length} modelos...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                2. Migrar Modelos Reales
              </>
            )}
          </Button>
        </div>

        {/* Botón principal todo-en-uno */}
        <div className="border-t border-primary/20 pt-4">
          <Button
            onClick={procesarTodo}
            disabled={procesandoTodo || limpiando || migrando}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-14 text-lg font-bold shadow-lg shadow-primary/20"
            size="lg"
          >
            {procesandoTodo ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Procesando migración completa...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-3" />
                🚀 MIGRAR TODO AHORA (Limpiar + Importar)
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Este botón ejecuta ambos pasos automáticamente
          </p>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Resultado de la Migración</h4>
              <div className="flex gap-2">
                <Badge className="bg-green-500/20 text-green-400">
                  {resultado.exitosas} exitosas
                </Badge>
                {resultado.fallidas > 0 && (
                  <Badge className="bg-red-500/20 text-red-400">
                    {resultado.fallidas} fallidas
                  </Badge>
                )}
                {resultado.eliminados && (
                  <Badge className="bg-gray-500/20 text-gray-400">
                    {resultado.eliminados} eliminadas
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
              {resultado.detalles.map((detalle, idx) => (
                <div key={idx} className="text-muted-foreground">
                  {detalle}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advertencia */}
        <div className="text-xs text-muted-foreground bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <strong>⚠️ Importante:</strong> Este proceso eliminará TODOS los perfiles actuales y los reemplazará con las modelos reales de la página web. No es reversible.
        </div>

        {/* Botón de Debug */}
        <div className="border-t border-border pt-4">
          <Button
            onClick={() => setMostrarDebug(true)}
            variant="outline"
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            🔍 Ver TODAS las modelos en BD (incluyendo inactivas)
          </Button>
        </div>
      </CardContent>

      {/* Modal de Debug */}
      {mostrarDebug && (
        <DebugModelosPanel onClose={() => setMostrarDebug(false)} />
      )}
    </Card>
  );
}