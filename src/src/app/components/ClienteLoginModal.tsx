import { useState } from 'react';
import { User, Phone, Lock, X, Loader2, CheckCircle, AlertCircle, Mail, Calendar, MapPin } from 'lucide-react';
import { useClientes } from './ClientesContext';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { supabase, projectId, publicAnonKey } from '../../utils/supabase/info'; // ✅ Corregido: ruta correcta
import { Logo } from './Logo';

interface ClienteLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (cliente: any) => void;
}

export function ClienteLoginModal({ isOpen, onClose, onLoginSuccess }: ClienteLoginModalProps) {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [exitoso, setExitoso] = useState(false);

  // Estados para login
  const [loginTelefono, setLoginTelefono] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados para registro
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
    setError('');
    setExitoso(false);
    setProcesando(false);
    onClose();
  };

  const handleLogin = async () => {
    if (!loginTelefono.trim() || !loginPassword.trim()) {
      setError('Por favor ingresa tu teléfono y contraseña');
      return;
    }

    setProcesando(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/clientes/login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telefono: loginTelefono,
            password: loginPassword
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Mensaje de error amigable y limpio
        if (errorData.error?.toLowerCase().includes('credenciales') || 
            errorData.error?.toLowerCase().includes('contraseña') ||
            errorData.error?.toLowerCase().includes('incorrecta')) {
          setError('Teléfono o contraseña incorrectos. Por favor verifica tus datos.');
        } else {
          setError('Error al iniciar sesión. Por favor intenta nuevamente.');
        }
        setProcesando(false);
        return;
      }

      const { cliente, token } = await response.json();

      // ✅ ÚNICA FUENTE DE VERDAD: Actualizar sesión en tabla clientes
      try {
        const { error: sesionError } = await supabase
          .from('clientes')
          .update({
            sesion_activa: true,
            sesion_token: token || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sesion_ultimo_acceso: new Date().toISOString(),
            sesion_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
          })
          .eq('id', cliente.id);

        if (sesionError) {
          console.error('❌ Error actualizando sesión:', sesionError);
          setError('Error al crear la sesión. Por favor intenta de nuevo.');
          setProcesando(false);
          return;
        }

        console.log('✅ Sesión iniciada correctamente');

        // ✅ Realtime detectará automáticamente la actualización en clientes
        
      } catch (err) {
        console.error('❌ Error completo actualizando sesión:', err);
        setError('Error al crear la sesión. Por favor intenta de nuevo.');
        setProcesando(false);
        return;
      }

      setExitoso(true);
      setTimeout(() => {
        onLoginSuccess(cliente);
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error en login:', err);
      setError('Error al iniciar sesión. Por favor verifica tu conexión e intenta nuevamente.');
      setProcesando(false);
    }
  };

  const handleRegistro = async () => {
    if (!nombre.trim() || !nombreUsuario.trim() || !telefono.trim() || !password.trim()) {
      setError('Nombre, nombre de usuario, teléfono y contraseña son obligatorios');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setProcesando(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/clientes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre,
            nombreUsuario,
            telefono,
            password,
            email: email || undefined,
            fechaNacimiento: fechaNacimiento || undefined,
            ciudad: ciudad || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Error al registrarse');
        setProcesando(false);
        return;
      }

      const nuevoCliente = await response.json();

      // ✅ ÚNICA FUENTE DE VERDAD: Actualizar sesión en tabla clientes
      try {
        const { error: sesionError } = await supabase
          .from('clientes')
          .update({
            sesion_activa: true,
            sesion_token: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sesion_ultimo_acceso: new Date().toISOString(),
            sesion_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
          })
          .eq('id', nuevoCliente.id);

        if (sesionError) {
          console.error('❌ Error actualizando sesión:', sesionError);
          setError('Error al crear la sesión. Intenta de nuevo.');
          setProcesando(false);
          return;
        }

        console.log('✅ Sesión actualizada en Supabase para cliente:', nuevoCliente.nombre);

        // ✅ Realtime detectará automáticamente la actualización en clientes
        
      } catch (err) {
        console.error('❌ Error completo actualizando sesión:', err);
        setError('Error al crear la sesión. Intenta de nuevo.');
        setProcesando(false);
        return;
      }

      setExitoso(true);
      setTimeout(() => {
        onLoginSuccess(nuevoCliente);
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
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
                {modo === 'login' 
                  ? 'Iniciando sesión...' 
                  : 'Tu cuenta ha sido creada exitosamente'}
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
            {/* Error */}
            {error && (
              <div className="p-2 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 overflow-hidden">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-400 break-words min-w-0">{error}</p>
              </div>
            )}

            {/* Teléfono */}
            <div className="space-y-2 overflow-hidden">
              <Label htmlFor="loginTelefono" className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="break-words min-w-0">Número de Teléfono</span>
              </Label>
              <Input
                id="loginTelefono"
                type="tel"
                value={loginTelefono}
                onChange={(e) => setLoginTelefono(e.target.value)}
                placeholder="3017626768"
                className="bg-secondary/50 w-full"
                disabled={procesando}
              />
            </div>

            {/* Contraseña */}
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

            {/* Botones */}
            <div className="space-y-3 w-full overflow-hidden">
              <Button
                onClick={handleLogin}
                disabled={procesando}
                className="w-full !whitespace-normal !h-auto !min-h-[44px] !py-3 !px-3 sm:!px-4 flex items-center justify-center !shrink"
                size="lg"
                style={{ whiteSpace: 'normal', height: 'auto', minHeight: '44px', flexShrink: 1 }}
              >
                {procesando ? (
                  <div className="flex items-center justify-center gap-2 w-full min-w-0">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin flex-shrink-0" />
                    <span className="break-words text-center text-xs sm:text-sm min-w-0">Verificando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 w-full min-w-0">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="break-words text-center text-xs sm:text-sm min-w-0">Iniciar Sesión</span>
                  </div>
                )}
              </Button>

              <div className="text-center overflow-hidden px-2">
                <button
                  type="button"
                  onClick={() => {
                    setModo('registro');
                    setError('');
                  }}
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

  // Formulario de registro
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card backdrop-blur-lg border-primary/30">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Logo variant="horizontal" size="md" />
          </div>
          <DialogTitle className="text-2xl text-center">
            Crear Cuenta Nueva
          </DialogTitle>
          <DialogDescription className="text-center">
            Completa tus datos para registrarte en Black Diamond
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre completo */}
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

            {/* Nombre de usuario */}
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

            {/* Teléfono */}
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

            {/* Email */}
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

            {/* Contraseña */}
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

            {/* Confirmar contraseña */}
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

            {/* Fecha de nacimiento */}
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

            {/* Ciudad */}
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

          {/* Botones */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleRegistro}
              disabled={procesando}
              className="w-full"
              size="lg"
            >
              {procesando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
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
                onClick={() => {
                  setModo('login');
                  setError('');
                }}
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