import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Logo } from './Logo';
import { supabase } from '../../utils/supabase/info'; // ✅ Corregido: ruta correcta

interface LoginFormProps {
  onLogin: (accessToken: string, userId: string, email: string, role: string) => void;
  onBackToLanding?: () => void;
}

// Formulario de login con Supabase Auth
export function LoginForm({ onLogin, onBackToLanding }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Login con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Mensajes de error amigables sin consolas técnicas
        if (authError.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos. Por favor verifica tus credenciales.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Debes confirmar tu email antes de iniciar sesión.');
        } else if (authError.message.includes('Invalid email')) {
          setError('Formato de email inválido.');
        } else {
          setError('Error al iniciar sesión. Intenta nuevamente.');
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
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        setError('No se pudo verificar el rol del usuario. Contacta al administrador.');
        setLoading(false);
        return;
      }

      const role = userData?.role;
      
      if (!role) {
        setError('Usuario sin rol asignado. Contacta al administrador.');
        setLoading(false);
        return;
      }

      // Login exitoso
      console.log('✅ Login exitoso');

      onLogin(
        authData.session.access_token,
        authData.user.id,
        authData.user.email || '',
        role
      );

    } catch (err: any) {
      console.error('Error en login:', err);
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
                <Logo size="md" showText={false} />
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
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="h-12 text-base"
                  />
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
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive font-semibold">{error}</p>
                    </div>
                    
                    {/* Ayuda adicional si es error de credenciales */}
                    {error.includes('incorrectos') && (
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                        <p className="text-sm font-semibold text-primary">💡 ¿No tienes usuario todavía?</p>
                        <p className="text-xs text-muted-foreground">
                          Necesitas crear un usuario en Supabase Auth primero. 
                        </p>
                        <details className="text-xs">
                          <summary className="cursor-pointer text-primary hover:text-primary/80 font-medium">
                            Ver cómo crear usuario →
                          </summary>
                          <div className="mt-2 p-3 bg-black/40 rounded space-y-2">
                            <p className="font-semibold">Opción 1: Desde la consola (F12):</p>
                            <code className="block text-[10px] overflow-x-auto">
{`const supabase = await import('https://esm.sh/@supabase/supabase-js@2').then(m => 
  m.createClient(
    'https://kzdjravwcjummegxxrkd.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  )
);
const { data } = await supabase.auth.signUp({
  email: 'test@test.com',
  password: '123456'
});`}
                            </code>
                            <p className="text-[10px] text-muted-foreground mt-2">
                              📄 Lee más en: <strong>/CREAR_USUARIO_PRUEBA.md</strong>
                            </p>
                          </div>
                        </details>
                      </div>
                    )}
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