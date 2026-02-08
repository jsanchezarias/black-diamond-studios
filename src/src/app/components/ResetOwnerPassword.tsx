import { Loader2, CheckCircle, Key } from 'lucide-react';
import { supabase } from '../../utils/supabase/info'; // ✅ Corregido: ruta correcta

// Página temporal para resetear la contraseña del owner
export function ResetOwnerPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [estado, setEstado] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mensaje, setMensaje] = useState('');

  const resetPassword = async () => {
    // Validaciones
    if (!newPassword || newPassword.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres');
      setEstado('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMensaje('Las contraseñas no coinciden');
      setEstado('error');
      return;
    }

    setEstado('loading');
    setMensaje('');

    try {
      // Primero, intentar iniciar sesión con el email del owner
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'jsanchezarias@gmail.com',
        password: 'cualquiera', // Intentamos con una contraseña cualquiera para obtener la sesión
      });

      if (signInError) {
        // Si no puede iniciar sesión, significa que necesitamos el enlace de reset
        setMensaje('⚠️ No se pudo cambiar la contraseña automáticamente. Por favor, ve al dashboard de Supabase y resetea la contraseña manualmente.');
        setEstado('error');
        return;
      }

      // Si logró iniciar sesión, actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setMensaje('✅ Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
      setEstado('success');
    } catch (error: any) {
      console.error('Error:', error);
      setMensaje(`❌ Error: ${error.message}`);
      setEstado('error');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-6 h-6 text-primary" />
            <CardTitle>Resetear Contraseña del Owner</CardTitle>
          </div>
          <CardDescription>
            Establece una nueva contraseña para tu cuenta de owner
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email del Owner</label>
            <Input 
              value="jsanchezarias@gmail.com" 
              disabled 
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nueva Contraseña</label>
            <Input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={estado === 'loading' || estado === 'success'}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirmar Contraseña</label>
            <Input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              disabled={estado === 'loading' || estado === 'success'}
            />
          </div>

          {mensaje && (
            <Alert variant={estado === 'success' ? 'default' : 'destructive'}>
              <AlertDescription className="whitespace-pre-line">
                {mensaje}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={resetPassword}
            disabled={estado === 'loading' || estado === 'success'}
            className="w-full"
          >
            {estado === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : estado === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Contraseña Actualizada
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Actualizar Contraseña
              </>
            )}
          </Button>

          {estado === 'success' && (
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Ir al Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}