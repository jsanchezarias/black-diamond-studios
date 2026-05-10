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
  tipo: 'cliente' | 'sistema';
  onLogin: (accessToken: string, userId: string, email: string, role: string) => void;
  onBackToLanding?: () => void;
}

// Formulario de login con Supabase Auth
export function LoginForm({ tipo, onLogin, onBackToLanding }: LoginFormProps) {
  const [tab, setTab] = useState<'login' | 'registro'>('login');
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para registro
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [emailRegistro, setEmailRegistro] = useState('');
  const [passwordRegistro, setPasswordRegistro] = useState('');
  const [registrando, setRegistrando] = useState(false);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrando(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailRegistro,
        password: passwordRegistro,
        options: { data: { nombre, telefono, role: 'cliente' } },
      });

      if (signUpError) {
        toast.error(translateSupabaseError(signUpError));
        return;
      }

      if (data.user) {
        const tel10 = telefono.replace(/[^0-9]/g, '').slice(-10);
        await supabase.from('usuarios').upsert({
          id: data.user.id,
          email: emailRegistro,
          nombre,
          role: 'cliente',
          estado: 'activo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        await supabase.from('clientes').upsert({
          user_id: data.user.id,
          email: emailRegistro,
          nombre,
          telefono: tel10 || null,
          total_servicios: 0,
          total_gastado: 0,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        await supabase.from('notificaciones').insert({
          para_rol: 'administrador',
          titulo: '👤 Nuevo cliente registrado',
          mensaje: `${nombre} creó su cuenta\n📧 ${emailRegistro}\n📞 ${telefono}`,
          tipo: 'nuevo_cliente',
          leida: false,
        });

        if (data.session) {
          onLogin(data.session.access_token, data.user.id, emailRegistro, 'cliente');
        } else {
          toast.success('✅ Cuenta creada — Inicia sesión con tu email y contraseña');
          setTab('login');
        }
      }
    } catch (err: any) {
      toast.error(translateSupabaseError(err));
    } finally {
      setRegistrando(false);
    }
  };

  const esEmail = (valor: string) => valor.includes('@');

  const loginCliente = async (emailParaLogin: string, pass: string) => {
    const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
      email: emailParaLogin, password: pass
    });
    if (error) { 
      const msg = translateSupabaseError(error);
      setError(msg);
      toast.error(msg);
      return;
    }

    // Buscar en usuarios primero
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user!.id)
      .maybeSingle();

    let role = usuario?.role;

    // Si no está en usuarios buscar en clientes
    if (!role) {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (cliente) role = 'cliente';
    }

    // Validar que es cliente
    if (role !== 'cliente') {
      const msg = 'Usa Acceso al sistema para ingresar';
      setError(msg);
      toast.error(msg);
      await supabase.auth.signOut();
      return;
    }

    onLogin(session!.access_token, user!.id, emailParaLogin, 'cliente');
  };

  const loginSistema = async (emailParaLogin: string, pass: string) => {
    const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
      email: emailParaLogin, password: pass
    });
    if (error) { 
      const msg = translateSupabaseError(error);
      setError(msg);
      toast.error(msg);
      return;
    }

    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user!.id)
      .maybeSingle();

    const role = usuario?.role;
    const rolesPermitidos = [
      'administrador', 'owner',
      'programador', 'modelo'
    ];

    if (!role || !rolesPermitidos.includes(role)) {
      const msg = 'Acceso no autorizado. Si eres cliente usa Iniciar sesión';
      setError(msg);
      toast.error(msg);
      await supabase.auth.signOut();
      return;
    }

    // Usar el rol REAL de Supabase
    onLogin(session!.access_token, user!.id, emailParaLogin, role);
  };

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

      if (tipo === 'cliente') {
        await loginCliente(emailParaLogin, password);
      } else {
        await loginSistema(emailParaLogin, password);
      }
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
                  {tipo === 'cliente' ? '◆ Bienvenido' : '🔒 Acceso al Sistema'}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {tipo === 'cliente'
                    ? 'Inicia sesión para reservar tu cita'
                    : 'Solo personal autorizado'}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {/* ── Tabs login / registro (solo clientes) ── */}
              {tipo === 'cliente' && (
                <div className="flex gap-1 mb-6 bg-[#0f1014] rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                      tab === 'login' ? 'bg-[#c9a961] text-[#0f1014]' : 'text-[#888]'
                    }`}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('registro')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                      tab === 'registro' ? 'bg-[#c9a961] text-[#0f1014]' : 'text-[#888]'
                    }`}
                  >
                    Crear cuenta
                  </button>
                </div>
              )}

              {/* ── Formulario de registro ── */}
              {tab === 'registro' && tipo === 'cliente' && (
                <form onSubmit={handleRegistro} className="space-y-4">
                  <div>
                    <label className="text-[#888] text-sm">Nombre completo</label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      required
                      className="w-full mt-1 px-4 py-3 rounded-lg bg-[#0f1014] border border-[#2a2a2a] text-[#e8e6e3] text-sm focus:border-[#c9a961] outline-none"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="text-[#888] text-sm">Teléfono</label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={e => setTelefono(e.target.value)}
                      required
                      className="w-full mt-1 px-4 py-3 rounded-lg bg-[#0f1014] border border-[#2a2a2a] text-[#e8e6e3] text-sm focus:border-[#c9a961] outline-none"
                      placeholder="+57 300 000 0000"
                    />
                  </div>
                  <div>
                    <label className="text-[#888] text-sm">Email</label>
                    <input
                      type="email"
                      value={emailRegistro}
                      onChange={e => setEmailRegistro(e.target.value)}
                      required
                      className="w-full mt-1 px-4 py-3 rounded-lg bg-[#0f1014] border border-[#2a2a2a] text-[#e8e6e3] text-sm focus:border-[#c9a961] outline-none"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-[#888] text-sm">Contraseña</label>
                    <input
                      type="password"
                      value={passwordRegistro}
                      onChange={e => setPasswordRegistro(e.target.value)}
                      required
                      minLength={6}
                      className="w-full mt-1 px-4 py-3 rounded-lg bg-[#0f1014] border border-[#2a2a2a] text-[#e8e6e3] text-sm focus:border-[#c9a961] outline-none"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={registrando}
                    className="w-full py-3.5 rounded-xl bg-[#c9a961] text-[#0f1014] font-bold text-base disabled:opacity-50 hover:bg-[#d4b86a] transition-colors"
                  >
                    {registrando ? '⏳ Creando cuenta...' : '◆ Crear mi cuenta'}
                  </button>
                </form>
              )}

              {/* ── Formulario de login ── */}
              {(tab === 'login' || tipo === 'sistema') && (
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
                  ) : tipo === 'cliente' ? (
                    '◆ Entrar'
                  ) : (
                    '🔒 Acceder'
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Si olvidaste tu contraseña, contacta al administrador del sistema.
                </p>
              </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}