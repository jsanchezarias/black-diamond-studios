import { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { supabase } from '../../utils/supabase/info'; // ✅ Corregido: ruta correcta

export function InitOwnerPage() {
  const [estado, setEstado] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mensaje, setMensaje] = useState('');
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  // Verificar si hay sesión activa al montar el componente
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setHasSession(false);
          setMensaje('⚠️ No hay sesión activa. Por favor, primero inicia sesión en la aplicación y luego accede a esta página.');
          setEstado('error');
          
          // Redirigir al login después de 5 segundos
          setTimeout(() => {
            window.location.href = '/';
          }, 5000);
        } else {
          setHasSession(true);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.error('Error verificando sesión:', error);
        setHasSession(false);
        setEstado('error');
        setMensaje('⚠️ Error verificando sesión. Serás redirigido al login...');
        
        setTimeout(() => {
          window.location.href = '/';
        }, 5000);
      } finally {
        setChecking(false);
      }
    };

    checkSession();
  }, []);

  const inicializarOwner = async () => {
    setEstado('loading');
    setMensaje('');

    try {
      // Obtener el usuario actual autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('No hay sesión activa. Por favor inicia sesión primero.');
      }

      // Insertar o actualizar directamente en la tabla usuarios
      const { error: upsertError } = await supabase
        .from('usuarios')
        .upsert({
          id: user.id,
          email: user.email,
          role: 'owner',
          nombre: 'Propietario',
          activo: true,
          fecha_creacion: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (upsertError) {
        throw new Error(upsertError.message || 'Error al inicializar Owner');
      }

      setEstado('success');
      setMensaje('¡Owner inicializado correctamente! Redirigiendo...');
      
      // Esperar 2 segundos y recargar
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error:', error);
      setEstado('error');
      setMensaje(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-primary/30">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Inicializar Cuenta Owner</CardTitle>
          <CardDescription className="text-base mt-2">
            Esta página te permite inicializar correctamente tu cuenta de propietario en el sistema
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instrucciones */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Instrucciones:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Asegúrate de haber iniciado sesión con tu cuenta owner desde Supabase</li>
              <li>Haz clic en el botón "Inicializar Owner" abajo</li>
              <li>El sistema registrará tu cuenta en el KV store con permisos de propietario</li>
              <li>Serás redirigido automáticamente al dashboard</li>
            </ol>
          </div>

          {/* Estado */}
          {estado === 'loading' && (
            <div className="flex items-center justify-center gap-3 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <p className="text-blue-500 font-medium">Inicializando cuenta...</p>
            </div>
          )}

          {estado === 'success' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <p className="text-green-500 font-medium">{mensaje}</p>
              </div>
              
              <p className="text-center text-sm text-muted-foreground">
                Redirigiendo al dashboard...
              </p>
            </div>
          )}

          {estado === 'error' && (
            <div className="flex items-center justify-center gap-3 p-6 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <div>
                <p className="text-destructive font-medium">Error</p>
                <p className="text-sm text-destructive/80 mt-1">{mensaje}</p>
              </div>
            </div>
          )}

          {/* Botón */}
          {estado === 'idle' && hasSession && (
            <Button
              onClick={inicializarOwner}
              size="lg"
              className="w-full"
            >
              <Shield className="w-5 h-5 mr-2" />
              Inicializar Owner
            </Button>
          )}

          {estado === 'error' && (
            <Button
              onClick={inicializarOwner}
              size="lg"
              className="w-full"
              variant="outline"
            >
              Intentar Nuevamente
            </Button>
          )}

          {/* Información adicional */}
          <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm space-y-2">
            <h4 className="font-semibold">ℹ️ Importante:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Solo necesitas hacer esto UNA VEZ</li>
              <li>• Si ya inicializaste tu cuenta, este proceso te lo confirmará</li>
              <li>• No afectará usuarios ya creados desde el panel</li>
              <li>• Después de esto podrás crear Admins desde el dashboard</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
