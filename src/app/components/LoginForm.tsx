import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Logo } from './Logo';
import { supabase } from '../../utils/supabase/info';
import { translateSupabaseError } from '../../utils/supabase/errors';
import { toast } from 'sonner';

interface LoginFormProps {
  onLogin: (accessToken: string, userId: string, email: string, role: string) => void;
  onBackToLanding?: () => void;
}

// Formulario de login con Supabase Auth
export function LoginForm({ onLogin, onBackToLanding }: LoginFormProps) {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const esEmail = (valor: string) => valor.includes('@');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let emailParaLogin = identificador.trim();

    try {
      if (!esEmail(emailParaLogin)) {
        const soloDigitos = emailParaLogin.replace(/[^0-9]/g, '');
        const tel10 = soloDigitos.slice(-10);

        const { data: clienteData } = await supabase
          .from('clientes')
          .select('email')
          .or(`telefono.eq.${tel10},telefono.eq.57${tel10},telefono.eq.+57${tel10}`)
          .maybeSingle();

        if (!clienteData?.email) {
          setError('No encontramos una cuenta con ese número.');
          setLoading(false);
          return;
        }
        emailParaLogin = clienteData.email;
      }

      // Login con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailParaLogin,
        password,
      });

      if (authError) {
        const msg = translateSupabaseError(authError);
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('No se pudo obtener la información del usuario.');
        setLoading(false);
        return;
      }

      // Obtener el rol del usuario desde la tabla usuarios
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('role, nombre, estado')
        .eq('id', authData.user.id)
        .maybeSingle();

      let role: string | null = null;

      if (userError || !userData) {
        // Si no está en usuarios, verificar si es cliente
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('id, email, nombre, bloqueado')
          .or(`user_id.eq.${authData.user.id},email.eq.${authData.user.email}`)
          .maybeSingle();

        if (clienteData) {
          if (clienteData.bloqueado) {
            setError('Tu cuenta está bloqueada. Contacta al administrador.');
            setLoading(false);
            return;
          }
          
          onLogin(
            authData.session.access_token,
            authData.user.id,
            authData.user.email || '',
            'cliente'
          );
          return;
        }

        const nombreAuto = authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'Cliente';

        const { data: newCliente, error: createError } = await supabase
          .from('clientes')
          .insert({
            user_id: authData.user.id,
            email: authData.user.email,
            nombre: nombreAuto,
            telefono: '000-' + authData.user.id.substring(0, 8),
            nombre_usuario: nombreAuto.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 100),
            created_at: new Date().toISOString()
          })
          .select()
          .maybeSingle();

        if (createError) {
          console.error('❌ Error creando perfil:', createError);
          toast.error('Error de perfil: ' + createError.message);
          setError('Error de base de datos: ' + createError.message);
          setLoading(false);
          return;
        }

        if (newCliente) {
          onLogin(
            authData.session.access_token,
            authData.user.id,
            authData.user.email || '',
            'cliente'
          );
          return;
        }

        setError('No se pudo inicializar tu perfil. Contacta al administrador.');
        setLoading(false);
        return;
      }

      // Verificar que la cuenta no esté inactiva o archivada
      if (userData.estado === 'inactivo' || userData.estado === 'archivado') {
        setError('Tu cuenta está inactiva. Contacta al administrador.');
        setLoading(false);
        return;
      }

      role = userData.role;

      if (!role) {
        setError('Usuario sin rol asignado. Contacta al administrador.');
        setLoading(false);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 [LoginForm] ROL RECIBIDO:', role);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 [LoginForm] ROL RECIBIDO:', role);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 [LoginForm] ROL RECIBIDO:', role);
      }

      onLogin(
        authData.session.access_token,
        authData.user.id,
        authData.user.email || '',
        role
      );

    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error en login:', err);
      const msg = translateSupabaseError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#1a1a1a] to-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efectos de fondo premium */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-glow-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Botón para volver */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-[-4px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
        )}

        <div className="relative">
          <Card className="relative backdrop-blur-premium bg-gradient-card border-primary/15 shadow-premium hover:shadow-premium hover:border-primary/25 transition-all duration-500">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex justify-center mb-2 animate-luxury-fade-in">
                <Logo size="md" />
              </div>
              <div className="text-center space-y-2">
                <CardTitle className="text-3xl font-['Cormorant_Garamond'] text-foreground">
                  Acceso al Sistema
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Ingresa tus credenciales para continuar
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email o teléfono */}
                <div className="space-y-2">
                  <Label htmlFor="identificador" className="text-sm font-medium">
                    Email o número de teléfono
                  </Label>
                  <Input
                    id="identificador"
                    type="text"
                    placeholder="tu@email.com o 3001234567"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="username"
                    className="h-12 text-base"
                  />
                  <p className="text-xs text-muted-foreground">Puedes usar tu email o número de celular</p>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="h-12 text-base"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive font-semibold">{error}</p>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Iniciando sesión...
                    </div>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Si olvidaste tu contraseña, contacta al administrador del sistema.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}