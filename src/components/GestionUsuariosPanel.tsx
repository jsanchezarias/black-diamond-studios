import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Mail, Calendar, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../src/utils/supabase/info'; // ✅ Corregido: ruta correcta
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  role: string;
  created_at: string;
}

interface GestionUsuariosPanelProps {
  accessToken?: string;
  userRole: 'owner' | 'admin';
}

export function GestionUsuariosPanel({ userRole }: GestionUsuariosPanelProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  
  // Form states
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [error, setError] = useState('');

  const roleACrear = userRole === 'owner' ? 'admin' : 'programador';
  const roleNombre = userRole === 'owner' ? 'Administrador' : 'Programador';

  useEffect(() => {
    cargarUsuarios();
  }, [userRole]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      
      // Cargar usuarios según el rol del usuario actual
      const rolABuscar = userRole === 'owner' ? 'admin' : 'programador';
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('role', rolABuscar)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando usuarios:', error);
        toast.error('Error al cargar usuarios: ' + error.message);
        return;
      }

      setUsuarios(data || []);
    } catch (error) {
      console.error('Error inesperado:', error);
      toast.error('Error inesperado al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setError('');

    // Validaciones básicas
    if (!nuevoEmail || !nuevoPassword || !nuevoNombre) {
      setError('Todos los campos son requeridos');
      setCreando(false);
      return;
    }

    if (nuevoPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setCreando(false);
      return;
    }

    try {
      console.log('📝 Creando usuario con role:', roleACrear);
      
      // Verificar si el email ya existe
      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios')
        .select('email, role')
        .eq('email', nuevoEmail)
        .single();

      if (existingUser && !checkError) {
        setError(`El email ${nuevoEmail} ya está registrado como ${existingUser.role}`);
        setCreando(false);
        return;
      }

      // Paso 1: Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: nuevoEmail,
        password: nuevoPassword,
        options: {
          data: {
            nombre: nuevoNombre,
            role: roleACrear
          },
          emailRedirectTo: undefined // Desactivar confirmación por email
        }
      });

      if (authError) {
        console.error('Error creando usuario en Auth:', authError);
        
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          setError(`El email ${nuevoEmail} ya está registrado en el sistema`);
        } else if (authError.message.includes('Invalid email')) {
          setError('El formato del email no es válido');
        } else {
          setError(`Error al crear credenciales: ${authError.message}`);
        }
        setCreando(false);
        return;
      }

      if (!authData.user) {
        setError('No se pudo crear el usuario en Auth');
        setCreando(false);
        return;
      }

      // Paso 2: Crear registro en la tabla usuarios
      const { error: dbError } = await supabase
        .from('usuarios')
        .upsert({
          id: authData.user.id,
          email: nuevoEmail,
          nombre: nuevoNombre,
          role: roleACrear
        }, {
          onConflict: 'id'
        });

      if (dbError) {
        console.error('Error creando usuario en tabla:', dbError);
        setError(`Error al guardar en base de datos: ${dbError.message}`);
        setCreando(false);
        return;
      }

      console.log('✅ Usuario creado exitosamente');

      // Recargar lista
      await cargarUsuarios();
      
      // Limpiar form
      setNuevoEmail('');
      setNuevoPassword('');
      setNuevoNombre('');
      setModalAbierto(false);
      toast.success(`✅ ${roleNombre} ${nuevoNombre} creado exitosamente`);
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      setError(err.message || 'Error desconocido al crear usuario');
      toast.error(err.message || 'Error al crear usuario');
    } finally {
      setCreando(false);
    }
  };

  const eliminarUsuario = async (usuarioId: string, usuarioEmail: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${usuarioEmail}?`)) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', usuarioId);

      if (error) {
        console.error('Error eliminando usuario:', error);
        alert(error.message || 'Error eliminando usuario');
      } else {
        await cargarUsuarios();
        toast.success(`Usuario ${usuarioEmail} eliminado exitosamente`);
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert('Error eliminando usuario');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de {roleNombre}es</h2>
          <p className="text-muted-foreground">Crear y administrar credenciales de {roleNombre}es</p>
        </div>
        
        <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="w-4 h-4 mr-2" />
              Crear {roleNombre}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a24] border-primary/30 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Crear Nuevo {roleNombre}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Ingresa los datos del nuevo {roleNombre.toLowerCase()}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={crearUsuario} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  required
                  disabled={creando}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={creando}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                  disabled={creando}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalAbierto(false)}
                  disabled={creando}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={creando}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {creando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Usuario'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de usuarios */}
      <div className="grid gap-4">
        {usuarios.length === 0 ? (
          <Card className="border-border bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No hay {roleNombre.toLowerCase()}es registrados
              </p>
              <p className="text-sm text-muted-foreground/60 text-center mt-2">
                Crea el primer {roleNombre.toLowerCase()} para comenzar
              </p>
            </CardContent>
          </Card>
        ) : (
          usuarios.map((usuario) => (
            <Card key={usuario.id} className="border-border bg-card/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{usuario.nombre}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {usuario.email}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarUsuario(usuario.id, usuario.email)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Creado: {new Date(usuario.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}