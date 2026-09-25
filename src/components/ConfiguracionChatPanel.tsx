import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Save, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../utils/supabase/info'; // ✅ Corregido: ruta correcta
import { toast } from 'sonner';

export function ConfiguracionChatPanel() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('programador@app.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [programadorExists, setProgramadorExists] = useState(false);
  const [programadorId, setProgramadorId] = useState<string | null>(null);

  useEffect(() => {
    cargarDatosProgramador();
  }, []);

  const cargarDatosProgramador = async () => {
    try {
      // 1. Buscar en la tabla usuarios por rol o email
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .or('email.eq.programador@app.com,role.eq.programador')
        .limit(1)
        .maybeSingle();

      if (usuario && !error) {
        setProgramadorExists(true);
        setProgramadorId(usuario.id);
        setUsername(usuario.nombre);
        setEmail(usuario.email);
        return;
      }

      // 2. Si no está en usuarios, buscar en clientes
      const { data: cliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', 'programador@app.com')
        .maybeSingle();

      if (cliente) {
        setProgramadorExists(true);
        setProgramadorId(cliente.id);
        setUsername(cliente.nombre);
        setEmail(cliente.email);
      } else {
        setProgramadorExists(false);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error cargando datos del programador:', error);
    }
  };

  const crearProgramador = async () => {
    if (!username || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const emailFinal = email || 'programador@app.com';

      // 1. Crear usuario en Auth y tabla usuarios mediante Edge Function
      let fnData: any = null;
      let errorMsg: string | null = null;

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          'bd-api/make-server-9dadc017/administrador/crear-usuario',
          {
            method: 'POST',
            body: {
              email: emailFinal,
              password,
              nombre: username,
              role: 'programador',
            },
          }
        );

        if (!fnError && data && !data.error) {
          fnData = data;
        } else {
          errorMsg = data?.error || fnError?.message || null;
        }
      } catch (errInv: any) {
        errorMsg = errInv?.message;
      }

      // Fallback a fetch directo
      if (!fnData && (!errorMsg || !errorMsg.includes('ya está registrado'))) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZGpyYXZ3Y2p1bW1lZ3h4cmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzY4ODIsImV4cCI6MjA4MzM1Mjg4Mn0.xC2QDsAzhYRRg8yakyRTChzHL_bleIT-u9mtKlNeBpc';
          const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZGpyYXZ3Y2p1bW1lZ3h4cmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzY4ODIsImV4cCI6MjA4MzM1Mjg4Mn0.xC2QDsAzhYRRg8yakyRTChzHL_bleIT-u9mtKlNeBpc';

          const resDirect = await fetch(
            'https://kzdjravwcjummegxxrkd.supabase.co/functions/v1/bd-api/make-server-9dadc017/administrador/crear-usuario',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'apikey': anonKey,
                'x-invoke-path': '/make-server-9dadc017/administrador/crear-usuario',
              },
              body: JSON.stringify({
                email: emailFinal,
                password,
                nombre: username,
                role: 'programador',
              }),
            }
          );

          const resJson = await resDirect.json().catch(() => null);
          if (resDirect.ok && resJson && !resJson.error) {
            fnData = resJson;
            errorMsg = null;
          } else if (resJson?.error) {
            errorMsg = resJson.error;
          }
        } catch (errFetch: any) {
          if (!errorMsg) errorMsg = errFetch?.message;
        }
      }

      if (!fnData) {
        throw new Error(errorMsg || 'Error al registrar credenciales del programador');
      }

      const userId = fnData?.userId || fnData?.user?.id;
      if (userId) {
        await supabase
          .from('usuarios')
          .update({ estado: 'activo' })
          .eq('id', userId);
      }

      // También registrar en clientes si el chat moderator lo requiere
      await supabase
        .from('clientes')
        .upsert({
          nombre: username,
          email: emailFinal,
          telefono: '3000000000',
          user_id: userId,
          total_servicios: 0,
          total_gastado: 0,
        }, { onConflict: 'email' });

      setProgramadorExists(true);
      setProgramadorId(userId || fnData.id);
      setPassword('');
      toast.success('✅ Usuario programador creado exitosamente con credenciales de acceso activas');

      // Crear mensaje de sistema si no existe
      await crearMensajeSistema();
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error creando programador:', error);
      toast.error(error.message || 'Error al crear usuario programador');
    } finally {
      setLoading(false);
    }
  };

  const actualizarProgramador = async () => {
    if (!programadorId) return;

    if (!username) {
      toast.error('El nombre de usuario es requerido');
      return;
    }

    setLoading(true);

    try {
      const emailFinal = email || 'programador@app.com';

      // 1. Si se ingresó una nueva contraseña, actualizar credenciales de Auth
      if (password && password.length >= 6) {
        const { data, error: credError } = await supabase.functions.invoke(
          'bd-api/make-server-9dadc017/administrador/actualizar-credenciales',
          {
            method: 'POST',
            body: {
              userId: programadorId,
              email: emailFinal,
              password,
            },
          }
        );

        if (credError || data?.error) {
          throw new Error(data?.error || credError?.message || 'Error al actualizar contraseña de acceso');
        }
      }

      // 2. Actualizar nombre en tabla usuarios
      await supabase
        .from('usuarios')
        .update({ nombre: username, updated_at: new Date().toISOString() })
        .eq('id', programadorId);

      // 3. Actualizar en tabla clientes
      await supabase
        .from('clientes')
        .update({ nombre: username })
        .eq('email', emailFinal);

      setPassword('');
      toast.success('✅ Usuario programador y credenciales actualizados exitosamente');
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') console.error('Error actualizando programador:', error);
      toast.error(error.message || 'Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  const crearMensajeSistema = async () => {
    try {
      // Verificar si ya existen mensajes en el chat
      const { data: mensajesExistentes } = await supabase
        .from('chat_mensajes_publicos')
        .select('id')
        .limit(1);

      if (mensajesExistentes && mensajesExistentes.length > 0) {
        return;
      }

      // Obtener ID del programador desde tabla clientes
      const { data: programador } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', 'programador@app.com')
        .single();

      if (!programador) {
        return;
      }

      // Crear mensaje de bienvenida
      await supabase
        .from('chat_mensajes_publicos')
        .insert({
          sender_id: programador.id,
          receiver_id: null,
          mensaje: '¡Bienvenidos al chat de Black Diamond! 💬 Regístrate para conversar con nuestra programadora'
        });

    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error creando mensaje del sistema:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💬 Configuración del Chat Público
          </CardTitle>
          <CardDescription>
            Configura las credenciales del usuario programador para el chat de la landing page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado del usuario */}
          <div className="p-4 rounded-lg border" style={{
            backgroundColor: programadorExists ? '#dcfce7' : '#fef3c7',
            borderColor: programadorExists ? '#86efac' : '#fde047'
          }}>
            <div className="flex items-center gap-2">
              {programadorExists ? (
                <>
                  <CheckCircle className="size-5 text-green-600" />
                  <span className="font-medium text-green-700">
                    Usuario programador configurado
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="size-5 text-yellow-600" />
                  <span className="font-medium text-yellow-700">
                    Usuario programador no encontrado - Debes crearlo
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Programadora Black Diamond"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Este nombre se mostrará en el chat
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground mt-1">
                El email no se puede cambiar
              </p>
            </div>

            <div>
              <Label htmlFor="password">
                {programadorExists ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={programadorExists ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {programadorExists 
                  ? 'Deja este campo vacío si no quieres cambiar la contraseña'
                  : 'Mínimo 6 caracteres'
                }
              </p>
            </div>
          </div>

          {/* Botón de acción */}
          <div className="flex gap-3">
            {programadorExists ? (
              <Button 
                onClick={actualizarProgramador} 
                disabled={loading}
                className="gap-2"
              >
                <Save className="size-4" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            ) : (
              <Button 
                onClick={crearProgramador} 
                disabled={loading}
                className="gap-2"
              >
                <Save className="size-4" />
                {loading ? 'Creando...' : 'Crear Usuario Programador'}
              </Button>
            )}
          </div>

          {/* Información adicional */}
          <div className="pt-4 border-t space-y-2">
            <h4 className="font-medium text-sm">Información Importante:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>El usuario programador puede ver TODOS los mensajes del chat</li>
              <li>Los usuarios normales solo ven sus conversaciones privadas</li>
              <li>Este usuario responde a las consultas de los visitantes</li>
              <li>Login simplificado: solo se requiere el teléfono registrado</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones SQL */}
      {!programadorExists && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📋 Alternativa: Crear con SQL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              También puedes crear el usuario ejecutando este SQL en Supabase:
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
              <pre>{`INSERT INTO clientes (
  nombre,
  telefono,
  email,
  total_servicios,
  total_gastado
) VALUES (
  'Programadora Black Diamond',
  '3000000000',
  'programador@app.com',
  0,
  0
) ON CONFLICT (telefono) DO NOTHING;`}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}