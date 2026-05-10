import { useState } from 'react';
import { User, Phone, Lock, Loader2, CheckCircle, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
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
        const { data: authDataEmail, error: authErrorEmail } = await supabase.auth.signInWithPassword({
          email: emailTelefono.trim(),
          password: password,
        });

        if (!authErrorEmail && authDataEmail.user) {
          authData = authDataEmail;
        } else if (authErrorEmail?.message.includes('Invalid login')) {
          setError('Credenciales incorrectas.');
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
            } else if (authError2?.message.includes('Invalid login')) {
              setError('Contraseña incorrecta.');
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
        .select('rol')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userProfile && ['admin', 'recepcion', 'superadmin', 'programador'].includes(userProfile.rol)) {
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
      const emailReal = isEmail ? emailTelefono.trim() : null;
      const telNormalizado = normalizarTelefono(telefono);
      const emailParaAuth = emailReal || telefonoToEmail(telNormalizado);
      const telefonoLimpio = telefono.replace(/[^0-9]/g, '').slice(-10);

      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id, email')
        .or(`telefono.eq.${telefonoLimpio},telefono.eq.57${telefonoLimpio},telefono.eq.+57${telefonoLimpio}`)
        .maybeSingle();

      if (clienteExistente) {
        setError('Ya existe una cuenta con ese número de teléfono. Inicia sesión.');
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
        .select()
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
        <DialogContent className="max-w-md bg-[#16181c] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {tab === 'login' ? 'Inicio de sesión exitoso' : 'Registro exitoso'}
            </DialogTitle>
            <DialogDescription className="sr-only">Bienvenido</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 space-y-6">
            <div className="flex justify-center">
              <Logo variant="horizontal" size="lg" />
            </div>
            <div className="w-20 h-20 rounded-full border-2 bg-[#c9a961]/20 border-[#c9a961] flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle className="w-12 h-12 text-[#c9a961]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2 text-[#c9a961]">
                {tab === 'login' ? '¡Bienvenido de vuelta!' : '¡Registro Exitoso!'}
              </h2>
              <p className="text-[#888]">Ingresando...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full bg-[#16181c] border-[#2a2a2a] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Acceso</DialogTitle>
          <DialogDescription>Acceso para clientes de Black Diamond</DialogDescription>
        </DialogHeader>

        <div className="p-6 pb-4 border-b border-[#2a2a2a]">
          <div className="flex justify-center mb-6">
            <Logo variant="horizontal" size="sm" />
          </div>
          <h2 className="text-xl font-bold text-center text-[#e8e6e3]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Bienvenido
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 0, padding: '0 24px', marginBottom: '20px', marginTop: '16px' }}>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            disabled={procesando}
            style={{
              flex: 1, padding: '10px',
              background: tab === 'login' ? 'rgba(255,215,0,0.15)' : 'transparent',
              border: '0.5px solid rgba(255,215,0,0.3)',
              borderRadius: '8px 0 0 8px',
              color: tab === 'login' ? '#FFD700' : 'rgba(255,255,255,0.5)',
              fontWeight: tab === 'login' ? 700 : 400,
              cursor: procesando ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => { setTab('registro'); setError(''); }}
            disabled={procesando}
            style={{
              flex: 1, padding: '10px',
              background: tab === 'registro' ? 'rgba(255,215,0,0.15)' : 'transparent',
              border: '0.5px solid rgba(255,215,0,0.3)',
              borderRadius: '0 8px 8px 0',
              color: tab === 'registro' ? '#FFD700' : 'rgba(255,255,255,0.5)',
              fontWeight: tab === 'registro' ? 700 : 400,
              cursor: procesando ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Crear cuenta
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 break-words">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#888]">Email o Teléfono</Label>
              <Input
                type="text"
                value={emailTelefono}
                onChange={(e) => setEmailTelefono(e.target.value)}
                placeholder="ejemplo@email.com o 3017626768"
                className="bg-[#0f1014] border-[#2a2a2a] text-[#e8e6e3] focus:border-[#c9a961]"
                disabled={procesando}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#888]">Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#0f1014] border-[#2a2a2a] text-[#e8e6e3] focus:border-[#c9a961]"
                disabled={procesando}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>

            {tab === 'registro' && (
              <>
                <div className="space-y-2">
                  <Label className="text-[#888]">Nombre Completo</Label>
                  <Input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan Pérez"
                    className="bg-[#0f1014] border-[#2a2a2a] text-[#e8e6e3] focus:border-[#c9a961]"
                    disabled={procesando}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#888]">Teléfono</Label>
                  <Input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="3017626768"
                    className="bg-[#0f1014] border-[#2a2a2a] text-[#e8e6e3] focus:border-[#c9a961]"
                    disabled={procesando}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  />
                </div>
              </>
            )}
          </div>

          <Button
            onClick={handleAuth}
            disabled={procesando}
            className="w-full h-12 bg-[#c9a961] hover:bg-[#d4b86a] text-[#0f1014] font-bold"
          >
            {procesando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>◆ Continuar</>
            )}
          </Button>

          <button
            onClick={handleClose}
            className="w-full py-2 flex items-center justify-center gap-2 text-sm text-[#888] hover:text-[#e8e6e3] transition-colors"
            disabled={procesando}
          >
            <ArrowLeft className="w-4 h-4" /> Volver a la landing
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
