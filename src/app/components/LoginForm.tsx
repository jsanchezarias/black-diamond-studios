import { useState } from 'react';
import { ArrowLeft, Loader2, Lock, Mail, Phone, User, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../../utils/supabase/info';
import { translateSupabaseError } from '../../utils/supabase/errors';
import { toast } from 'sonner';

interface LoginFormProps {
  tipo: 'cliente' | 'sistema';
  onLogin: (accessToken: string, userId: string, email: string, role: string) => void;
  onBackToLanding?: () => void;
}

// Formulario de login premium con Supabase Auth
export function LoginForm({ tipo, onLogin, onBackToLanding }: LoginFormProps) {
  const [tab, setTab] = useState<'login' | 'registro'>('login');
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para registro
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [emailRegistro, setEmailRegistro] = useState('');
  const [passwordRegistro, setPasswordRegistro] = useState('');
  const [showPasswordRegistro, setShowPasswordRegistro] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrando(true);
    setError('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailRegistro.trim().toLowerCase(),
        password: passwordRegistro,
        options: { data: { nombre, telefono, role: 'cliente' } },
      });

      if (signUpError) {
        const msg = translateSupabaseError(signUpError);
        setError(msg);
        toast.error(msg);
        return;
      }

      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        await supabase.auth.signOut();
        const msg = 'Ya existe una cuenta con ese correo. Inicia sesión en su lugar.';
        setError(msg);
        toast.error(msg);
        return;
      }

      if (data.user) {
        const tel10 = telefono.replace(/[^0-9]/g, '').slice(-10);
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
      const msg = translateSupabaseError(err);
      setError(msg);
      toast.error(msg);
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
    const { data: usuario } = await supabase
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
      const msg = 'Usa el Acceso al Sistema administrativo para ingresar.';
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

    const { data: usuario, error: _userError } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user!.id)
      .maybeSingle();

    if (_userError) {
      console.error('❌ Error consultando perfil en usuarios:', _userError);
    }

    const role = usuario?.role;
    const rolesPermitidos = [
      'administrador', 'owner',
      'programador', 'modelo',
      'contador', 'recepcionista', 'supervisor', 'moderador'
    ];

    if (!role || !rolesPermitidos.includes(role)) {
      const msg = 'Acceso no autorizado. Si eres cliente usa Iniciar sesión.';
      setError(msg);
      toast.error(msg);
      await supabase.auth.signOut();
      return;
    }

    onLogin(session!.access_token, user!.id, emailParaLogin, role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let emailParaLogin = identificador.trim().toLowerCase();

    try {
      if (!esEmail(emailParaLogin)) {
        const soloDigitos = emailParaLogin.replace(/[^0-9]/g, '');
        const tel10 = soloDigitos.slice(-10);

        const { data: emailData } = await supabase
          .rpc('get_email_by_telefono', { p_telefono: tel10 });

        if (!emailData) {
          setError('No encontramos una cuenta asociada a ese número de teléfono.');
          setLoading(false);
          return;
        }
        emailParaLogin = emailData;
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
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 15%, rgba(201, 56, 90, 0.15) 0%, rgba(13, 15, 20, 0.98) 55%, #050608 100%)',
      }}
    >
      {/* Luces volumétricas ambientales de lujo */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#c9385a]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 right-10 w-[400px] h-[300px] bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Botón para volver */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50 hover:text-white transition-all duration-300 hover:-translate-x-1 group"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <ArrowLeft className="w-4 h-4 text-[#c9385a] transition-transform group-hover:-translate-x-0.5" />
            Volver al inicio
          </button>
        )}

        {/* Tarjeta Glassmorphic de Lujo */}
        <div
          className="relative rounded-3xl overflow-hidden p-6 sm:p-8 transition-all duration-500"
          style={{
            background: 'linear-gradient(165deg, rgba(22, 25, 33, 0.88) 0%, rgba(12, 14, 18, 0.94) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(201, 56, 90, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Cabecera / Identidad */}
          <div className="text-center space-y-3 pb-6 border-b border-white/5">
            <div className="flex justify-center mb-1">
              <Logo size="md" variant="vertical" />
            </div>

            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#c9385a]/30 bg-[#c9385a]/10 text-[10px] uppercase font-bold tracking-[0.2em] text-[#e8a2af]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#c9385a]" />
                {tipo === 'cliente' ? 'Acceso Exclusivo' : 'Portal Corporativo'}
              </div>
            </div>

            <h1
              className="text-2xl sm:text-3xl font-bold text-white tracking-wide mt-2"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {tipo === 'cliente' ? 'Bienvenido a Black Diamond' : 'Acceso al Sistema'}
            </h1>

            <p
              className="text-xs text-white/55 font-light max-w-xs mx-auto leading-relaxed"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {tipo === 'cliente'
                ? 'Ingresa para agendar citas privadas y acceder a contenido exclusivo'
                : 'Autenticación confidencial y segura para personal autorizado'}
            </p>
          </div>

          {/* Segmented Control Tabs (solo clientes) */}
          {tipo === 'cliente' && (
            <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 flex gap-1 mt-6 mb-6">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  tab === 'login'
                    ? 'bg-gradient-to-r from-[#C23A54] to-[#A11D3A] text-white shadow-lg'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => { setTab('registro'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  tab === 'registro'
                    ? 'bg-gradient-to-r from-[#C23A54] to-[#A11D3A] text-white shadow-lg'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Crear cuenta
              </button>
            </div>
          )}

          {/* Alerta de Error estilizada */}
          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-300 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* ── Formulario de registro (Clientes) ── */}
          {tab === 'registro' && tipo === 'cliente' && (
            <form onSubmit={handleRegistro} className="space-y-4 mt-6">
              {/* Nombre completo */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider text-white/80 uppercase block">
                  Nombre completo
                </label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40 group-focus-within/field:text-[#c9385a] transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                    placeholder="Tu nombre completo"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c9385a] focus:ring-2 focus:ring-[#c9385a]/25 focus:bg-white/[0.06] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider text-white/80 uppercase block">
                  Teléfono de contacto
                </label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40 group-focus-within/field:text-[#c9385a] transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    required
                    placeholder="3143107403"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c9385a] focus:ring-2 focus:ring-[#c9385a]/25 focus:bg-white/[0.06] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider text-white/80 uppercase block">
                  Correo electrónico
                </label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40 group-focus-within/field:text-[#c9385a] transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={emailRegistro}
                    onChange={e => setEmailRegistro(e.target.value)}
                    required
                    placeholder="ejemplo@correo.com"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c9385a] focus:ring-2 focus:ring-[#c9385a]/25 focus:bg-white/[0.06] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Contraseña con botón de mostrar/ocultar */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider text-white/80 uppercase block">
                  Contraseña
                </label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40 group-focus-within/field:text-[#c9385a] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPasswordRegistro ? 'text' : 'password'}
                    value={passwordRegistro}
                    onChange={e => setPasswordRegistro(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full h-12 pl-10 pr-11 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c9385a] focus:ring-2 focus:ring-[#c9385a]/25 focus:bg-white/[0.06] transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordRegistro(!showPasswordRegistro)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
                    title={showPasswordRegistro ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPasswordRegistro ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={registrando}
                className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden group shadow-lg mt-2"
                style={{
                  background: 'linear-gradient(135deg, #C23A54 0%, #A11D3A 50%, #6B1226 100%)',
                  boxShadow: '0 4px 20px rgba(161, 29, 58, 0.4)',
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {registrando ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Creando membresía...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Crear mi cuenta</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── Formulario de login (Clientes y Sistema) ── */}
          {(tab === 'login' || tipo === 'sistema') && (
            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
              {/* Email o teléfono */}
              <div className="space-y-1.5">
                <label
                  htmlFor="identificador"
                  className="text-[11px] font-semibold tracking-wider text-white/80 uppercase block"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Email o número de teléfono
                </label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40 group-focus-within/field:text-[#c9385a] transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="identificador"
                    type="text"
                    placeholder="tu@email.com o 3143107403"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c9385a] focus:ring-2 focus:ring-[#c9385a]/25 focus:bg-white/[0.06] transition-all duration-200"
                  />
                </div>
                <p className="text-[10px] text-white/40 pl-1">Puedes usar tu correo electrónico o tu número de celular</p>
              </div>

              {/* Contraseña con botón de mostrar/ocultar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-[11px] font-semibold tracking-wider text-white/80 uppercase block"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Contraseña
                  </label>
                </div>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40 group-focus-within/field:text-[#c9385a] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="current-password"
                    className="w-full h-12 pl-10 pr-11 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c9385a] focus:ring-2 focus:ring-[#c9385a]/25 focus:bg-white/[0.06] transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botón de acción principal */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group shadow-lg mt-2"
                style={{
                  background: 'linear-gradient(135deg, #C23A54 0%, #A11D3A 50%, #6B1226 100%)',
                  boxShadow: '0 4px 20px rgba(161, 29, 58, 0.4)',
                  fontFamily: "'Montserrat', sans-serif",
                  letterSpacing: '0.12em',
                }}
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verificando credenciales...</span>
                  </div>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-white" />
                    <span>{tipo === 'cliente' ? 'Entrar al Club' : 'Acceder al Sistema'}</span>
                  </>
                )}
              </button>

              {/* Pie de seguridad y recuperación */}
              <div className="pt-3 text-center space-y-3 border-t border-white/5 mt-4">
                <p className="text-[11px] text-white/45">
                  ¿Problemas para acceder?{' '}
                  <span className="text-[#c9385a] font-semibold cursor-default">Contacta al administrador del sistema</span>
                </p>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 uppercase tracking-wider pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Conexión cifrada SSL 256-bit · Black Diamond Security</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}