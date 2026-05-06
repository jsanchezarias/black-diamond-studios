import { useState } from 'react';
import { User, Phone, Lock, Loader2, CheckCircle, AlertCircle, Mail, Calendar, MapPin } from 'lucide-react';
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
}

// Convierte teléfono en email sintético para Supabase Auth
const telefonoToEmail = (telefono: string) =>
  `${telefono.replace(/\s+/g, '')}@clientes.blackdiamond.app`;

export function ClienteLoginModal({ isOpen, onClose, onLoginSuccess }: ClienteLoginModalProps) {
  const { loginUser } = usePublicUsers();
  const [modo, setModo] = useState<'login' | 'registro' | 'recuperar'>('login');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [exitoso, setExitoso] = useState(false);
  const [recuperarEnviado, setRecuperarEnviado] = useState(false);

  // Login
  const [loginTelefono, setLoginTelefono] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Recuperar contraseña
  const [recuperarTelefono, setRecuperarTelefono] = useState('');

  // Registro
  const [nombre, setNombre] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [ciudad, setCiudad] = useState('');

  const handleClose = () => {
    setModo('login');
    setLoginTelefono('');
    setLoginPassword('');
    setNombre('');
    setNombreUsuario('');
    setTelefono('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFechaNacimiento('');
    setCiudad('');
    setRecuperarTelefono('');
    setRecuperarEnviado(false);
    setError('');
    setExitoso(false);
    setProcesando(false);
    onClose();
  };

  const handleRecuperar = async () => {
    if (!recuperarTelefono.trim()) {
      const msg = 'Por favor ingresa tu número de teléfono';
      setError(msg);
      toast.error(msg);
      return;
    }

    setProcesando(true);
    setError('');

    try {
      // Buscar el cliente por teléfono para ver si tiene email real
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('email, nombre')
        .eq('telefono', recuperarTelefono.trim())
        .maybeSingle();

      if (!clienteData) {
        setError('No encontramos una cuenta con ese número de teléfono.');
        return;
      }

      if (clienteData.email) {
        // Enviar reset al email real del cliente
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          clienteData.email,
          { redirectTo: `${window.location.origin}/reset-password` }
        );
        if (resetError) throw resetError;
      } else {
        // No tiene email — enviar al email sintético (igual genera el link de reset)
        const emailSintetico = telefonoToEmail(recuperarTelefono.trim());
        await supabase.auth.resetPasswordForEmail(emailSintetico, {
          redirectTo: `${window.location.origin}/reset-password`
        });
      }

      setRecuperarEnviado(true);
    } catch (err: any) {
      const msg = translateSupabaseError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setProcesando(false);
    }
  };

  const normalizarTelefono = (tel: string): string => {
    const soloDigitos = tel.replace(/[^0-9]/g, '');
    if (soloDigitos.startsWith('57') && soloDigitos.length >= 12) {
      return soloDigitos.substring(2);
    }
    return soloDigitos;
  };

  const handleLogin = async () => {
    if (!loginTelefono.trim() || !loginPassword.trim()) {
      const msg = 'Por favor ingresa tu teléfono y contraseña';
      setError(msg);
      toast.error(msg);
      return;
    }

    setProcesando(true);
    setError('');

    try {
      const isEmail = loginTelefono.includes('@');
      const telNormalizado = !isEmail ? normalizarTelefono(loginTelefono) : '';
      const emailSintetico = !isEmail ? telefonoToEmail(telNormalizado) : '';

      let authData: any = null;

      if (isEmail) {
        // Login directo con Email
        const { data: authDataEmail, error: authErrorEmail } = await supabase.auth.signInWithPassword({
          email: loginTelefono.trim(),
          password: loginPassword,
        });

        if (!authErrorEmail && authDataEmail.user) {
          authData = authDataEmail;
        } else if (authErrorEmail?.message.includes('Invalid login')) {
          setError('Credenciales incorrectas.');
          setProcesando(false);
          return;
        }
      } else {
        // Intento 1: login con email sintético (usuarios registrados por teléfono sin email)
        const { data: authData1, error: authError1 } = await supabase.auth.signInWithPassword({
          email: emailSintetico,
          password: loginPassword,
        });

        if (!authError1 && authData1.user) {
          authData = authData1;
        } else {
          // Intento 2: buscar email real en tabla clientes por teléfono
          const { data: clientePorTel } = await supabase
            .from('clientes')
            .select('email')
            .or(`telefono.eq.${telNormalizado},telefono.eq.+57${telNormalizado},telefono.eq.57${telNormalizado}`)
            .not('email', 'is', null)
            .maybeSingle();

          if (clientePorTel?.email) {
            const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
              email: clientePorTel.email,
              password: loginPassword,
            });
            if (!authError2 && authData2.user) {
              authData = authData2;
            } else if (authError2?.message.includes('Invalid login')) {
              setError('Contraseña incorrecta.');
              return;
            } else if (authError2?.message.includes('Email not confirmed')) {
              setError('Email no confirmado. Contacta al administrador.');
              return;
            }
          }
        }
      }

      if (!authData?.user) {
        setError('No encontramos una cuenta con ese número. ¿Ya te registraste?');
        return;
      }

      // Obtener perfil de cliente por user_id o por email
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('*')
        .or(`user_id.eq.${authData.user.id},email.eq.${authData.user.email}`)
        .maybeSingle();

      if (!clienteData) {
        setError('No se encontró tu perfil de cliente. Contacta al administrador.');
        await supabase.auth.signOut();
        return;
      }

      if (clienteData.bloqueado) {
        setError('Tu cuenta ha sido bloqueada. Contacta al administrador.');
        await supabase.auth.signOut();
        return;
      }

      // Actualizar sesión activa
      await supabase
        .from('clientes')
        .update({
          sesion_activa: true,
          sesion_ultimo_acceso: new Date().toISOString(),
          sesion_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', clienteData.id);

      // Guardar también en localStorage para que App.tsx reconozca la sesión del dashboard
      if (authData.session && authData.user) {
        // ✅ CRÍTICO: El accessToken NO se guarda en localStorage.
        // Se mantiene en memoria y en sessionStorage manejado por Supabase.
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
        // Ya no recargamos la página; dejamos que el estado de App.tsx reaccione al localStorage/Context
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
    if (!nombre.trim() || !nombreUsuario.trim() || !telefono.trim() || !password.trim()) {
      const msg = 'Nombre, nombre de usuario, teléfono y contraseña son obligatorios';
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
    if (password !== confirmPassword) {
      const msg = 'Las contraseñas no coinciden';
      setError(msg);
      toast.error(msg);
      return;
    }

    setProcesando(true);
    setError('');

    try {
      const telNormalizado = normalizarTelefono(telefono);
      const emailSintetico = telefonoToEmail(telNormalizado);
      const emailParaAuth = email.trim() || emailSintetico;
      const telefonoLimpio = telefono.replace(/[^0-9]/g, '').slice(-10);

      // 0. Verificar en la tabla clientes primero
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id, email')
        .or(
          `telefono.eq.${telefonoLimpio},telefono.eq.57${telefonoLimpio},telefono.eq.+57${telefonoLimpio}`
        )
        .maybeSingle();

      if (clienteExistente) {
        setError('Ya existe una cuenta con ese número de teléfono. Intenta iniciar sesión.');
        setProcesando(false);
        return;
      }

      // 1. Crear usuario en Supabase Auth
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
        return;
      }

      if (!authData.user) {
        const msg = 'Error al crear el usuario. Intenta nuevamente.';
        setError(msg);
        toast.error(msg);
        return;
      }

      // 2. Insertar perfil en tabla clientes
      const nuevoCliente = {
        user_id: authData.user.id,
        nombre: nombre.trim(),
        nombre_usuario: nombreUsuario.trim(),
        telefono: telefono.trim(),
        email: email.trim() || null,
        fecha_nacimiento: fechaNacimiento || null,
        ciudad: ciudad.trim() || null,
        sesion_activa: true,
        sesion_ultimo_acceso: new Date().toISOString(),
        sesion_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        password_hash: 'supabase-auth', // columna requerida, la auth real está en Supabase Auth
      };

      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .upsert(nuevoCliente, { onConflict: 'user_id' })
        .select()
        .single();

      if (clienteError) {
        // Si falla la inserción, limpiar el usuario de auth
        await supabase.auth.signOut();
        const msg = translateSupabaseError(clienteError);
        setError(msg);
        toast.error(msg);
        return;
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

  // Pantalla de éxito
  if (exitoso) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-sm border-primary/30">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {modo === 'login' ? 'Inicio de sesión exitoso' : 'Registro exitoso'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {modo === 'login' ? 'Bienvenido de vuelta' : 'Tu cuenta ha sido creada'}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 space-y-6">
            <div className="flex justify-center">
              <Logo variant="horizontal" size="lg" />
            </div>
            <div className="w-20 h-20 rounded-full border-2 bg-green-500/20 border-green-500 flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2 text-green-500">
                {modo === 'login' ? '¡Bienvenido de vuelta!' : '¡Registro Exitoso!'}
              </h2>
              <p className="text-muted-foreground">
                {modo === 'login' ? 'Iniciando sesión...' : 'Tu cuenta ha sido creada exitosamente'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Formulario de login
  if (modo === 'login') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full bg-card backdrop-blur-lg border-primary/30 p-3 sm:p-6 overflow-x-hidden">
          <DialogHeader className="space-y-2 sm:space-y-4">
            <div className="flex justify-center">
              <div className="max-w-[200px] w-full">
                <Logo variant="horizontal" size="sm" />
              </div>
            </div>
            <DialogTitle className="text-xl sm:text-2xl text-center break-words">
              Iniciar Sesión
            </DialogTitle>
            <DialogDescription className="text-center text-xs sm:text-sm break-words px-2">
              Ingresa tus credenciales para acceder
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
            {error && (
              <div className="p-2 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 overflow-hidden">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-400 break-words min-w-0">{error}</p>
              </div>
            )}

            <div className="space-y-2 overflow-hidden">
              <Label htmlFor="loginTelefono" className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                <User className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="break-words min-w-0">Email o Teléfono</span>
              </Label>
              <Input
                id="loginTelefono"
                type="text"
                value={loginTelefono}
                onChange={(e) => setLoginTelefono(e.target.value)}
                placeholder="ejemplo@email.com o 3017626768"
                className="bg-secondary/50 w-full"
                disabled={procesando}
              />
            </div>

            <div className="space-y-2 overflow-hidden">
              <Label htmlFor="loginPassword" className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                <Lock className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="break-words min-w-0">Contraseña</span>
              </Label>
              <Input
                id="loginPassword"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary/50 w-full"
                disabled={procesando}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div className="space-y-3 w-full overflow-hidden">
              <Button
                onClick={handleLogin}
                disabled={procesando}
                className="w-full !whitespace-normal !h-auto !min-h-[44px] !py-3"
                size="lg"
              >
                {procesando ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Verificando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Iniciar Sesión</span>
                  </div>
                )}
              </Button>

              <div className="text-center overflow-hidden px-2 space-y-2">
                <button
                  type="button"
                  onClick={() => { setModo('recuperar'); setError(''); }}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-primary hover:underline break-words block w-full"
                  disabled={procesando}
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <button
                  type="button"
                  onClick={() => { setModo('registro'); setError(''); }}
                  className="text-xs sm:text-sm text-primary hover:underline break-words"
                  disabled={procesando}
                >
                  ¿No tienes cuenta? Regístrate aquí
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Formulario de recuperar contraseña
  if (modo === 'recuperar') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full bg-card backdrop-blur-lg border-primary/30 p-3 sm:p-6">
          <DialogHeader className="space-y-2 sm:space-y-4">
            <div className="flex justify-center">
              <div className="max-w-[200px] w-full">
                <Logo variant="horizontal" size="sm" />
              </div>
            </div>
            <DialogTitle className="text-xl sm:text-2xl text-center">
              Recuperar Contraseña
            </DialogTitle>
            <DialogDescription className="text-center text-xs sm:text-sm px-2">
              Ingresa tu número de teléfono y te enviaremos un enlace de recuperación a tu correo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {error && (
              <div className="p-2 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-400 break-words min-w-0">{error}</p>
              </div>
            )}

            {recuperarEnviado ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-9 h-9 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-500 mb-1">¡Correo enviado!</h3>
                  <p className="text-sm text-muted-foreground">
                    Si tu cuenta tiene un correo registrado, recibirás un enlace para restablecer tu contraseña.
                  </p>
                </div>
                <Button
                  onClick={() => { setModo('login'); setRecuperarEnviado(false); setError(''); }}
                  variant="outline"
                  className="w-full"
                >
                  Volver al inicio de sesión
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="recuperarTelefono" className="flex items-center gap-2 text-xs sm:text-sm">
                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                    Número de Teléfono
                  </Label>
                  <Input
                    id="recuperarTelefono"
                    type="tel"
                    value={recuperarTelefono}
                    onChange={(e) => setRecuperarTelefono(e.target.value)}
                    placeholder="3017626768"
                    className="bg-secondary/50 w-full"
                    disabled={procesando}
                    onKeyDown={(e) => e.key === 'Enter' && handleRecuperar()}
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleRecuperar}
                    disabled={procesando}
                    className="w-full !min-h-[44px]"
                    size="lg"
                  >
                    {procesando ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        <span className="text-xs sm:text-sm">Enviando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">Enviar Enlace de Recuperación</span>
                      </div>
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setModo('login'); setError(''); }}
                      className="text-xs sm:text-sm text-primary hover:underline"
                      disabled={procesando}
                    >
                      Volver al inicio de sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Formulario de registro
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card backdrop-blur-lg border-primary/30">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Logo variant="horizontal" size="md" />
          </div>
          <DialogTitle className="text-2xl text-center">Crear Cuenta Nueva</DialogTitle>
          <DialogDescription className="text-center">
            Completa tus datos para registrarte en Black Diamond
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div style={{
              background: 'rgba(255,0,0,0.1)',
              border: '1px solid rgba(255,0,0,0.3)',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16
            }}>
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p style={{ color: '#FF4444', margin: 0, fontSize: 14 }}>
                  {error}
                </p>
              </div>
              {(error.toLowerCase().includes('teléfono') || error.toLowerCase().includes('cuenta')) && (
                <button
                  type="button"
                  onClick={() => {
                    setModo('login');
                    setError('');
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #FF4444',
                    color: '#FF4444',
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'block',
                    marginTop: 8
                  }}
                >
                  Ir a iniciar sesión →
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Nombre Completo *
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Juan Pérez"
                className="bg-secondary/50"
                disabled={procesando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombreUsuario">Nombre de Usuario *</Label>
              <Input
                id="nombreUsuario"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="juanperez"
                className="bg-secondary/50"
                disabled={procesando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Teléfono *
              </Label>
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="3017626768"
                className="bg-secondary/50"
                disabled={procesando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email (opcional)
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@ejemplo.com"
                className="bg-secondary/50"
                disabled={procesando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Contraseña *
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="bg-secondary/50"
                disabled={procesando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="bg-secondary/50"
                disabled={procesando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaNacimiento" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Fecha de Nacimiento (opcional)
              </Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="bg-secondary/50"
                disabled={procesando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ciudad" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Ciudad (opcional)
              </Label>
              <Input
                id="ciudad"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Bogotá"
                className="bg-secondary/50"
                disabled={procesando}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleRegistro}
              disabled={procesando}
              className="w-full"
              size="lg"
            >
              {procesando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Crear Cuenta
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setModo('login'); setError(''); }}
                className="text-sm text-primary hover:underline"
                disabled={procesando}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
