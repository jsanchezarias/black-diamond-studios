import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Logo } from './Logo';
import { supabase } from '../../utils/supabase/info'; // ✅ Corregido: ruta correcta

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
        // Mensajes de error amigables sin consolas técnicas
        if (authError.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Email o contraseña incorrectos.');
        } else if (authError.message.includes('too many requests')) {
          setError('Demasiados intentos. Espera unos minutos.');
        } else {
          setError('Email o contraseña incorrectos.');
        }
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
        .single();

      let role: string | null = null;

      if (userError || !userData) {
        // Logging específico por código de error para diagnóstico
        if (userError?.code === 'PGRST116') {
          console.error('USUARIO NO EXISTE EN TABLA usuarios:', authData.user.id, authData.user.email);
        } else if (userError?.code === '42501') {
          console.error('RLS BLOQUEANDO LECTURA:', authData.user.id);
        } else {
          console.error('ROL NO ENCONTRADO:', { userId: authData.user.id, email: authData.user.email, error: userError });
        }

        // Fallback: intentar con metadata de auth
        const roleMeta = authData.user.user_metadata?.role || authData.user.app_metadata?.role;
        if (roleMeta) {
          onLogin(
            authData.session.access_token,
            authData.user.id,
            authData.user.email || '',
            roleMeta
          );
          return;
        }

        setError('No se pudo verificar el rol del usuario. Contacta al administrador.');
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
        // Fallback: intentar con metadata de auth
        const roleMeta = authData.user.user_metadata?.role || authData.user.app_metadata?.role;
        if (roleMeta) {
          onLogin(
            authData.session.access_token,
            authData.user.id,
            authData.user.email || '',
            roleMeta
          );
          return;
        }
        setError('Usuario sin rol asignado. Contacta al administrador.');
        setLoading(false);
        return;
      }

      onLogin(
        authData.session.access_token,
        authData.user.id,
        authData.user.email || '',
        role
      );

    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error en login:', err);
      setError('Error inesperado. Por favor intenta nuevamente.');
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