import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, Lock, Mail, User, Phone, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { supabase } from '../../utils/supabase/info';
import { translateSupabaseError } from '../../utils/supabase/errors';
import { Logo } from './Logo';
import { usePublicUsers } from './PublicUsersContext';

interface ClienteLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (cliente: any) => void;
  tabInicial?: 'login' | 'registro'; // ✅ NUEVO: abrir en tab específico desde paywall
}

const telefonoToEmail = (telefono: string) =>
  `${telefono.replace(/\s+/g, '')}@clientes.blackdiamond.app`;

export function ClienteLoginModal({ isOpen, onClose, onLoginSuccess, tabInicial = 'login' }: ClienteLoginModalProps) {
  const { loginUser } = usePublicUsers();
  const [tab, setTab] = useState<'login' | 'registro'>(tabInicial);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [exitoso, setExitoso] = useState(false);

  // Campos unificados
  const [emailTelefono, setEmailTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Solo para registro
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');

  const handleClose = () => {
    setTab(tabInicial); // ✅ resetear al tab pedido por el paywall, no siempre a 'login'
    setEmailTelefono('');
    setPassword('');
    setNombre('');
    setTelefono('');
    setError('');
    setExitoso(false);
    setProcesando(false);
    onClose();
  };

  const normalizarTelefono = (tel: string): string => {
    const soloDigitos = tel.replace(/[^0-9]/g, '');
    if (soloDigitos.startsWith('57') && soloDigitos.length >= 12) {
      return soloDigitos.substring(2);
    }
    return soloDigitos;
  };

  const handleAuth = async () => {
    if (tab === 'login') {
      await handleLogin();
    } else {
      await handleRegistro();
    }
  };

  const handleLogin = async () => {
    if (!emailTelefono.trim() || !password.trim()) {
      const msg = 'Por favor ingresa tu email/teléfono y contraseña';
      setError(msg);
      toast.error(msg);
      return;
    }

    setProcesando(true);
    setError('');

    try {
      const isEmail = emailTelefono.includes('@');
      const telNormalizado = !isEmail ? normalizarTelefono(emailTelefono) : '';
      const emailSintetico = !isEmail ? telefonoToEmail(telNormalizado) : '';

      let authData: any = null;

      if (isEmail) {
        // En celular el teclado suele poner en mayúscula la primera letra del campo, lo que
        // rompe el login si el usuario no se da cuenta — normalizamos antes de autenticar.
        const { data: authDataEmail, error: authErrorEmail } = await supabase.auth.signInWithPassword({
          email: emailTelefono.trim().toLowerCase(),
          password: password,
        });

        if (!authErrorEmail && authDataEmail.user) {
          authData = authDataEmail;
        } else if (authErrorEmail) {
          const msg = authErrorEmail.message.includes('Invalid login')
            ? 'Credenciales incorrectas.'
            : translateSupabaseError(authErrorEmail);
          setError(msg);
          setProcesando(false);
          return;
        }
      } else {
        const { data: authData1, error: authError1 } = await supabase.auth.signInWithPassword({
          email: emailSintetico,
          password: password,
        });

        if (!authError1 && authData1.user) {
          authData = authData1;
        } else {
          const { data: clientePorTel } = await supabase
            .from('clientes')
            .select('email')
            .or(`telefono.eq.${telNormalizado},telefono.eq.+57${telNormalizado},telefono.eq.57${telNormalizado}`)
            .not('email', 'is', null)
            .maybeSingle();

          if (clientePorTel?.email) {
            const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
              email: clientePorTel.email,
              password: password,
            });
            if (!authError2 && authData2.user) {
              authData = authData2;
            } else if (authError2) {
              const msg = authError2.message.includes('Invalid login')
                ? 'Contraseña incorrecta.'
                : translateSupabaseError(authError2);
              setError(msg);
              setProcesando(false);
              return;
            }
          }
        }
      }

      if (!authData?.user) {
        setError('No encontramos una cuenta con ese número o correo.');
        setProcesando(false);
        return;
      }

      // Verificar rol (NO debe ser staff)
      const { data: userProfile } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userProfile && ['administrador', 'admin', 'owner', 'recepcionista', 'programador'].includes(userProfile.role)) {
        await supabase.auth.signOut();
        setError('Usa "Acceso al sistema" para ingresar con cuenta de staff.');
        setProcesando(false);
        return;
      }

      const { data: clienteData } = await supabase
        .from('clientes')
        .select('*')
        .or(`user_id.eq.${authData.user.id},email.eq.${authData.user.email}`)
        .maybeSingle();

      if (!clienteData) {
        setError('No se encontró tu perfil de cliente.');
        await supabase.auth.signOut();
        setProcesando(false);
        return;
      }

      if (clienteData.bloqueado) {
        setError('Tu cuenta ha sido bloqueada. Contacta al administrador.');
        await supabase.auth.signOut();
        setProcesando(false);
        return;
      }

      await supabase
        .from('clientes')
        .update({
          sesion_activa: true,
          sesion_ultimo_acceso: new Date().toISOString(),
          sesion_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', clienteData.id);

      if (authData.session && authData.user) {
        localStorage.setItem('blackDiamondUser', JSON.stringify({
          userId: authData.user.id,
          email: authData.user.email || '',
          role: 'cliente'
        }));
      }

      loginUser(clienteData);
      setExitoso(true);
      setTimeout(() => {
        onLoginSuccess(clienteData);
        handleClose();
      }, 1500);
    } catch (err: any) {
      const msg = translateSupabaseError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setProcesando(false);
    }
  };

  const handleRegistro = async () => {
    if (!emailTelefono.trim() || !password.trim() || !nombre.trim() || !telefono.trim()) {
      const msg = 'Todos los campos son obligatorios para crear cuenta';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (password.length < 6) {
      const msg = 'La contraseña debe tener al menos 6 caracteres';
      setError(msg);
      toast.error(msg);
      return;
    }

    setProcesando(true);
    setError('');

    try {
      const isEmail = emailTelefono.includes('@');
      const emailReal = isEmail ? emailTelefono.trim().toLowerCase() : null;
      const telNormalizado = normalizarTelefono(telefono);
      const emailParaAuth = emailReal || telefonoToEmail(telNormalizado);
      const telefonoLimpio = telefono.replace(/[^0-9]/g, '').slice(-10);

      const filtroExistente = emailReal
        ? `telefono.eq.${telefonoLimpio},telefono.eq.57${telefonoLimpio},telefono.eq.+57${telefonoLimpio},email.eq.${emailReal}`
        : `telefono.eq.${telefonoLimpio},telefono.eq.57${telefonoLimpio},telefono.eq.+57${telefonoLimpio}`;

      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id, email, telefono')
        .or(filtroExistente)
        .maybeSingle();

      if (clienteExistente) {
        const msg = emailReal && clienteExistente.email?.toLowerCase() === emailReal
          ? 'Ya existe una cuenta con ese correo. Inicia sesión.'
          : 'Ya existe una cuenta con ese número de teléfono. Inicia sesión.';
        setError(msg);
        setProcesando(false);
        return;
      }

      // Generate a username based on name
      const nombreUsuario = nombre.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailParaAuth,
        password,
        options: {
          data: { nombre, nombreUsuario, telefono: telNormalizado, role: 'cliente' },
        },
      });

      if (authError) {
        const msg = translateSupabaseError(authError);
        setError(msg);
        toast.error(msg);
        setProcesando(false);
        return;
      }

      if (!authData.user) {
        const msg = 'Error al crear el usuario. Intenta nuevamente.';
        setError(msg);
        toast.error(msg);
        setProcesando(false);
        return;
      }

      // Supabase no da error cuando el correo ya tiene cuenta (para no revelar qué
      // correos existen) — en su lugar devuelve un "éxito" con identities vacío y
      // sin sesión. Sin este chequeo, seguíamos de largo y sobrescribíamos el
      // perfil de la cuenta real ya existente con los datos de este formulario.
      const emailYaExistia = (authData.user.identities?.length ?? 0) === 0;
      if (emailYaExistia) {
        await supabase.auth.signOut();
        const msg = 'Ya existe una cuenta con ese correo. Inicia sesión en su lugar.';
        setError(msg);
        toast.error(msg);
        setProcesando(false);
        return;
      }

      const nuevoCliente = {
        user_id: authData.user.id,
        nombre: nombre.trim(),
        nombre_usuario: nombreUsuario,
        telefono: telefono.trim(),
        email: emailReal,
        sesion_activa: true,
        sesion_ultimo_acceso: new Date().toISOString(),
        sesion_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        password_hash: 'supabase-auth',
      };

      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .upsert(nuevoCliente, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (clienteError) {
        await supabase.auth.signOut();
        const msg = translateSupabaseError(clienteError);
        setError(msg);
        toast.error(msg);
        setProcesando(false);
        return;
      }

      if (authData.session && authData.user) {
        localStorage.setItem('blackDiamondUser', JSON.stringify({
          userId: authData.user.id,
          email: authData.user.email || '',
          role: 'cliente'
        }));
      }

      loginUser(clienteData);
      setExitoso(true);
      setTimeout(() => {
        onLoginSuccess(clienteData);
        handleClose();
      }, 1500);
    } catch (err: any) {
      const msg = translateSupabaseError(err);
      setError(msg);
      toast.error(msg);
      setProcesando(false);
    }
  };

  if (exitoso) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-md bg-[#0e1017] border border-white/10 rounded-3xl p-8 overflow-hidden shadow-2xl text-center"
          style={{
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(201,56,90,0.15)',
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>
              {tab === 'login' ? 'Inicio de sesión exitoso' : 'Registro exitoso'}
            </DialogTitle>
            <DialogDescription>Bienvenido</DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="flex justify-center">
              <Logo variant="vertical" size="sm" />
            </div>

            <div className="w-16 h-16 rounded-full border-2 bg-emerald-500/15 border-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h2
                className="text-2xl font-bold text-white tracking-wide"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {tab === 'login' ? '¡Bienvenido de vuelta!' : '¡Membresía Creada!'}
              </h2>
              <p className="text-xs text-white/50" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Iniciando sesión segura...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md w-[calc(100vw-2rem)] sm:w-full bg-[#0d0f15] border border-white/10 rounded-3xl p-0 overflow-hidden shadow-2xl"
        style={{
          backdropFilter: 'blur(24px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(201,56,90,0.1)',
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Acceso a Black Diamond</DialogTitle>
          <DialogDescription>Acceso para clientes de Black Diamond</DialogDescription>
        </DialogHeader>

        {/* Cabecera del modal */}
        <div className="p-6 pb-5 text-center border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className="flex justify-center mb-3">
            <Logo variant="vertical" size="sm" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#c9385a]/30 bg-[#c9385a]/10 text-[10px] uppercase font-bold tracking-[0.2em] text-[#e8a2af] mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#c9385a]" />
            Acceso Exclusivo Clientes
          </div>

          <h2
            className="text-2xl font-bold text-white tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Bienvenido a Black Diamond
          </h2>
          <p className="text-xs text-white/50 font-light mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Reserva tus experiencias y accede a beneficios privados
          </p>
        </div>

        {/* Segmented Control Tabs */}
        <div className="px-6 pt-4">
          <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 flex gap-1">
            <button
              onClick={() => { setTab('login'); setError(''); }}
              disabled={procesando}
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
              onClick={() => { setTab('registro'); setError(''); }}
              disabled={procesando}
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
        </div>

        {/* Cuerpo del formulario */}
        <div className="p-6 pt-4 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start gap-2.5 text-xs text-red-300 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed break-words">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Solo Registro: Nombre Completo */}
            {tab === 'registro' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider text-white/80 uppercase block">
                  Nombre Completo
                </label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40 group-focus-within/field:text-[#c9385a] transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre completo"
                    disabled={procesando}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c9385a] focus:ring-2 focus:ring-[#c9385a]/25 focus:bg-white/[0.06] transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {/* Email o Teléfono */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-white/80 uppercase block">
                {tab === 'registro' ? 'Teléfono Móvil' : 'Email o Teléfono'}
              </label>
              <div className="relative group/field">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40 group-focus-within/field:text-[#c9385a] transition-colors">
                  {tab === 'registro' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                {tab === 'registro' ? (
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="3143107403"
                    disabled={procesando}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c9385a] focus:ring-2 focus:ring-[#c9385a]/25 focus:bg-white/[0.06] transition-all duration-200"
                  />
                ) : (
                  <input
                    type="text"
                    value={emailTelefono}
                    onChange={(e) => setEmailTelefono(e.target.value)}
                    placeholder="ejemplo@email.com o 3143107403"
                    disabled={procesando}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c9385a] focus:ring-2 focus:ring-[#c9385a]/25 focus:bg-white/[0.06] transition-all duration-200"
                  />
                )}
              </div>
            </div>

            {/* Contraseña con toggle Eye/EyeOff */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-white/80 uppercase block">
                Contraseña
              </label>
              <div className="relative group/field">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40 group-focus-within/field:text-[#c9385a] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={procesando}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
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
          </div>

          {/* Botón de acción principal */}
          <button
            onClick={handleAuth}
            disabled={procesando}
            className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden group shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #C23A54 0%, #A11D3A 50%, #6B1226 100%)',
              boxShadow: '0 4px 20px rgba(161, 29, 58, 0.4)',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {procesando ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Procesando...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>{tab === 'login' ? 'Entrar al Club' : 'Crear mi cuenta'}</span>
              </>
            )}
          </button>

          {/* Botón volver */}
          <button
            onClick={handleClose}
            className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/45 hover:text-white transition-colors"
            disabled={procesando}
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#c9385a]" /> Volver a la página
          </button>

          {/* Badge de seguridad SSL */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-white/30 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cifrado SSL 256-bit · Black Diamond Security</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
