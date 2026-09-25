import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Mail, Calendar, User, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../utils/supabase/info';
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
  userRole: 'owner' | 'administrador';
}

export function GestionUsuariosPanel({ userRole }: GestionUsuariosPanelProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; email: string } | null>(null);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', email: '', password: '' });
  const [editError, setEditError] = useState('');

  // Form states para crear
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [error, setError] = useState('');

  const [roleACrear, setRoleACrear] = useState<'administrador' | 'programador'>(
    userRole === 'owner' ? 'administrador' : 'programador'
  );
  const roleNombre = roleACrear === 'administrador' ? 'Administrador' : 'Programador';

  useEffect(() => {
    cargarUsuarios();
  }, [userRole]);

  const abrirEditar = (usuario: Usuario) => {
    setEditando(usuario);
    setEditForm({ nombre: usuario.nombre, email: usuario.email, password: '' });
    setEditError('');
  };

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setGuardandoEdit(true);
    setEditError('');

    try {
      const authData: Record<string, string> = {};
      const publicData: Record<string, string> = {};

      const cleanEditEmail = editForm.email?.trim().toLowerCase();
      if (cleanEditEmail && cleanEditEmail !== editando.email) authData.email = cleanEditEmail;
      if (editForm.password && editForm.password.length >= 6) authData.password = editForm.password;
      if (editForm.nombre && editForm.nombre.trim() !== editando.nombre) publicData.nombre = editForm.nombre.trim();

      if (Object.keys(authData).length === 0 && Object.keys(publicData).length === 0) {
        setEditError('No hay cambios para guardar');
        setGuardandoEdit(false);
        return;
      }

      if (editForm.password && editForm.password.length > 0 && editForm.password.length < 6) {
        setEditError('La contraseña debe tener al menos 6 caracteres');
        setGuardandoEdit(false);
        return;
      }

      let updated = false;

      // 1. Intentar actualizar vía admin-update-user
      try {
        const { data, error: fnError } = await supabase.functions.invoke('admin-update-user', {
          body: { targetUserId: editando.id, authData, publicData },
        });

        if (!fnError && !data?.error) {
          updated = true;
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') console.warn('admin-update-user fallo, probando fallback:', e);
      }

      // 2. Fallback a actualizar-credenciales del servidor si admin-update-user no funcionó
      if (!updated) {
        const { data: credData, error: credError } = await supabase.functions.invoke(
          'bd-api/make-server-9dadc017/administrador/actualizar-credenciales',
          {
            method: 'POST',
            body: {
              userId: editando.id,
              email: authData.email || undefined,
              password: authData.password || undefined,
            },
          }
        );

        if (!credError && !credData?.error) {
          updated = true;
          if (publicData.nombre) {
            await supabase.from('usuarios').update({ nombre: publicData.nombre }).eq('id', editando.id);
          }
        } else {
          throw new Error(credData?.error || credError?.message || 'Error al actualizar usuario');
        }
      }

      await cargarUsuarios();
      setEditando(null);
      toast.success(`✅ Usuario ${editForm.nombre || editando.nombre} actualizado`);
    } catch (err: any) {
      setEditError(err.message || 'Error al actualizar usuario');
    } finally {
      setGuardandoEdit(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      
      // Cargar usuarios administradores y programadores
      const rolesABuscar = ['administrador', 'programador'];
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, email, nombre, role, created_at')
        .in('role', rolesABuscar)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('Error cargando usuarios:', error);
        toast.error('Error al cargar usuarios: ' + error.message);
        return;
      }

      setUsuarios(data || []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error inesperado:', error);
      toast.error('Error inesperado al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setError('');

    const cleanEmail = nuevoEmail.trim().toLowerCase();
    const cleanNombre = nuevoNombre.trim();

    // Validaciones básicas
    if (!cleanEmail || !nuevoPassword || !cleanNombre) {
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
      // 1. Invocar vía Supabase Functions con path directo
      let fnData: any = null;
      let mensajeError: string | null = null;

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          'bd-api/make-server-9dadc017/administrador/crear-usuario',
          {
            method: 'POST',
            body: {
              email: cleanEmail,
              password: nuevoPassword,
              nombre: cleanNombre,
              role: roleACrear,
            }
          }
        );

        if (!fnError && data && !data.error) {
          fnData = data;
        } else {
          mensajeError = data?.error || fnError?.message || null;
        }
      } catch (errInv: any) {
        mensajeError = errInv?.message;
      }

      // 2. Fallback a fetch directo si functions.invoke falló
      if (!fnData) {
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
                email: cleanEmail,
                password: nuevoPassword,
                nombre: cleanNombre,
                role: roleACrear,
              })
            }
          );

          const resJson = await resDirect.json().catch(() => null);
          if (resDirect.ok && resJson && !resJson.error) {
            fnData = resJson;
            mensajeError = null;
          } else {
            mensajeError = resJson?.error || `Error HTTP ${resDirect.status}`;
          }
        } catch (errFetch: any) {
          mensajeError = errFetch?.message || mensajeError;
        }
      }

      if (!fnData) {
        if (mensajeError?.includes('already registered') || mensajeError?.includes('ya está registrado')) {
          mensajeError = `El correo ${cleanEmail} ya se encuentra registrado en el sistema. Puedes editar su contraseña desde la lista.`;
        }
        setError(mensajeError || 'Error al crear usuario en el servidor');
        setCreando(false);
        return;
      }

      // Asegurar que el estado en la tabla usuarios esté activo
      const userId = fnData?.userId || fnData?.user?.id;
      if (userId) {
        await supabase
          .from('usuarios')
          .update({ estado: 'activo', updated_at: new Date().toISOString() })
          .eq('id', userId);
      }

      // Recargar lista
      await cargarUsuarios();

      // Limpiar form
      setNuevoEmail('');
      setNuevoPassword('');
      setNuevoNombre('');
      setModalAbierto(false);
      toast.success(`✅ ${roleNombre} ${cleanNombre} creado exitosamente`);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error completo:', err);
      setError(err.message || 'Error desconocido al crear usuario');
      toast.error(err.message || 'Error al crear usuario');
    } finally {
      setCreando(false);
    }
  };

  const eliminarUsuario = async (usuarioId: string, usuarioEmail: string) => {
    setConfirmDelete({ id: usuarioId, email: usuarioEmail });
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;
    const { id: usuarioId, email: usuarioEmail } = confirmDelete;
    setConfirmDelete(null);
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', usuarioId);

      if (error) {
        if (process.env.NODE_ENV === 'development') console.error('Error eliminando usuario:', error);
        toast.error(error.message || 'Error eliminando usuario');
      } else {
        await cargarUsuarios();
        toast.success(`Usuario ${usuarioEmail} eliminado exitosamente`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error eliminando usuario:', error);
      toast.error('Error eliminando usuario');
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
          <h2 className="text-2xl font-bold">Gestión de Usuarios del Sistema</h2>
          <p className="text-muted-foreground">Crear y administrar credenciales de administradores y programadores</p>
        </div>
        
        <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a24] border-primary/30 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Crear Nuevo Usuario del Sistema</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Ingresa los datos y selecciona el rol para el nuevo acceso
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={crearUsuario} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label>Rol del Usuario</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={roleACrear === 'administrador' ? 'default' : 'outline'}
                    className={roleACrear === 'administrador' ? 'bg-primary text-white font-medium' : 'border-border/60 text-muted-foreground'}
                    onClick={() => setRoleACrear('administrador')}
                    disabled={creando}
                  >
                    Administrador
                  </Button>
                  <Button
                    type="button"
                    variant={roleACrear === 'programador' ? 'default' : 'outline'}
                    className={roleACrear === 'programador' ? 'bg-primary text-white font-medium' : 'border-border/60 text-muted-foreground'}
                    onClick={() => setRoleACrear('programador')}
                    disabled={creando}
                  >
                    Programador
                  </Button>
                </div>
              </div>

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
                    `Crear ${roleNombre}`
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
                No hay usuarios registrados
              </p>
              <p className="text-sm text-muted-foreground/60 text-center mt-2">
                Crea el primer administrador o programador para comenzar
              </p>
            </CardContent>
          </Card>
        ) : (
          usuarios.map((usuario) => (
            <Card key={usuario.id} className="border-border bg-card/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{usuario.nombre}</CardTitle>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                        usuario.role === 'administrador'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {usuario.role === 'administrador' ? 'Administrador' : 'Programador'}
                      </span>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {usuario.email}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirEditar(usuario)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      title="Editar usuario"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarUsuario(usuario.id, usuario.email)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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

      {/* Modal de edición de usuario */}
      {editando && (
        <Dialog open={!!editando} onOpenChange={() => setEditando(null)}>
          <DialogContent className="bg-[#1a1a24] border-primary/30 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Editar {roleNombre}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modificar datos de <span className="text-white font-semibold">{editando.email}</span>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={guardarEdicion} className="space-y-4">
              {editError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {editError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre Completo</Label>
                <Input
                  id="edit-nombre"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre completo"
                  disabled={guardandoEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Correo Electrónico</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  disabled={guardandoEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">Nueva Contraseña <span className="text-muted-foreground">(dejar vacío para no cambiar)</span></Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  disabled={guardandoEdit}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditando(null)}
                  disabled={guardandoEdit}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={guardandoEdit}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {guardandoEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de confirmación de eliminación */}
      {confirmDelete && (
        <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
          <DialogContent className="bg-[#1a1a24] border-red-500/30 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Eliminar Usuario</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                ¿Estás seguro de eliminar a <span className="text-white font-semibold">{confirmDelete.email}</span>? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={confirmarEliminar} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                Eliminar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}