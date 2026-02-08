import { Label } from './ui/label';
import { Save, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../src/utils/supabase/info'; // ✅ Corregido: ruta correcta
import { toast } from 'sonner@2.0.3';

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
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', 'programador@app.com')
        .single();

      if (data && !error) {
        setProgramadorExists(true);
        setProgramadorId(data.id);
        setUsername(data.nombre);
        setEmail(data.email);
        console.log('✅ Usuario programador encontrado:', data);
      } else {
        setProgramadorExists(false);
        console.log('⚠️ Usuario programador no encontrado');
      }
    } catch (error) {
      console.error('Error cargando datos del programador:', error);
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
      // Crear programador SIN password_hash
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nombre: username,
          email: 'programador@app.com',
          telefono: '3000000000', // Teléfono del programador
          total_servicios: 0,
          total_gastado: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creando programador:', error);
        toast.error('Error al crear usuario programador');
        return;
      }

      setProgramadorExists(true);
      setProgramadorId(data.id);
      setPassword('');
      toast.success('Usuario programador creado exitosamente');

      // Crear mensaje de sistema si no existe
      await crearMensajeSistema();
    } catch (error) {
      console.error('Error creando programador:', error);
      toast.error('Error al crear usuario');
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
      const updates: any = {
        nombre: username
      };

      // ⚠️ La tabla clientes no tiene password_hash, solo actualizar nombre
      const { error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', programadorId);

      if (error) {
        console.error('❌ Error actualizando programador:', error);
        toast.error('Error al actualizar usuario');
        return;
      }

      setPassword('');
      toast.success('Usuario programador actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando programador:', error);
      toast.error('Error al actualizar usuario');
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
        console.log('✅ Ya existen mensajes en el chat');
        return;
      }

      // Obtener ID del programador desde tabla clientes
      const { data: programador } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', 'programador@app.com')
        .single();

      if (!programador) {
        console.warn('⚠️ Usuario programador no existe');
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

      console.log('✅ Mensaje de bienvenida creado');
    } catch (error) {
      console.error('Error creando mensaje del sistema:', error);
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