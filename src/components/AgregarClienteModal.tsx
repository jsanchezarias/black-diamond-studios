import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { User, Phone, Mail, MapPin, Calendar, Star, Save, X, Lock, Eye, EyeOff } from 'lucide-react';
import { useClientes } from '../src/app/components/ClientesContext';
import { toast } from 'sonner@2.0.3';

interface AgregarClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgregarClienteModal({ isOpen, onClose }: AgregarClienteModalProps) {
  const { agregarCliente, buscarPorTelefono } = useClientes();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    telefono: '',
    nombre: '',
    nombreUsuario: '',
    email: '',
    password: '', // Campo de contraseña
    confirmPassword: '', // Confirmar contraseña
    fechaNacimiento: '',
    ciudad: '',
    preferencias: '',
    notas: '',
    rating: 5,
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generar nombreUsuario si se cambia el nombre
    if (field === 'nombre' && typeof value === 'string') {
      const nombreUsuarioGenerado = value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      setFormData(prev => ({ ...prev, nombreUsuario: nombreUsuarioGenerado }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.telefono || !formData.nombre) {
      toast.error('Teléfono y nombre son obligatorios');
      return;
    }

    // Validar contraseña
    if (!formData.password || formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Verificar si el cliente ya existe
    const clienteExistente = buscarPorTelefono(formData.telefono);
    if (clienteExistente) {
      toast.error('Ya existe un cliente con este número de teléfono');
      return;
    }

    setLoading(true);

    try {
      await agregarCliente({
        telefono: formData.telefono,
        nombre: formData.nombre,
        nombreUsuario: formData.nombreUsuario || formData.nombre.toLowerCase().replace(/\s+/g, ''),
        password: formData.password, // Enviar contraseña al servidor
        email: formData.email || undefined,
        fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento) : undefined,
        ciudad: formData.ciudad || undefined,
        preferencias: formData.preferencias || undefined,
        notas: formData.notas || undefined,
        rating: formData.rating,
      });

      // Mensaje según si tiene email o no
      if (formData.email) {
        toast.success(
          `✅ Cliente registrado exitosamente.\n\n` +
          `📧 Se ha enviado un email a:\n${formData.email}\n\n` +
          `El email contiene sus credenciales de acceso:\n` +
          `• Teléfono: ${formData.telefono}\n` +
          `• Contraseña: (la que definió)\n\n` +
          `💡 Se recomienda cambiar la contraseña en el primer login.`,
          { duration: 8000 }
        );
      } else {
        toast.success(
          `✅ Cliente registrado exitosamente.\n\n` +
          `Credenciales de acceso:\n` +
          `• Teléfono: ${formData.telefono}\n` +
          `• Contraseña: ${formData.password}\n\n` +
          `⚠️ Sin email registrado, no se envió notificación.\n` +
          `Comunique estas credenciales al cliente manualmente.`,
          { duration: 8000 }
        );
      }
      
      // Limpiar formulario
      setFormData({
        telefono: '',
        nombre: '',
        nombreUsuario: '',
        email: '',
        password: '', // Limpiar contraseña
        confirmPassword: '', // Limpiar confirmar contraseña
        fechaNacimiento: '',
        ciudad: '',
        preferencias: '',
        notas: '',
        rating: 5,
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error al gestionar cliente:', error);
      
      // Mensajes de error más claros para el usuario
      let errorMessage = 'Error al agregar cliente';
      
      if (error.message?.includes('timeout') || error.name === 'AbortError') {
        errorMessage = 'El servidor tardó demasiado en responder. Por favor, verifica tu conexión e intenta nuevamente.';
      } else if (error.message?.includes('500') || error.message?.includes('Internal server error')) {
        errorMessage = 'Error temporal del servidor. Intentando nuevamente...';
      } else if (error.message?.includes('statement timeout')) {
        errorMessage = 'La operación tomó demasiado tiempo. Por favor, intenta nuevamente.';
      } else if (error.message) {
        // Limpiar mensajes técnicos de HTML
        if (error.message.includes('<!DOCTYPE html>')) {
          errorMessage = 'Error de conexión con el servidor. Por favor, intenta nuevamente en unos momentos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card backdrop-blur-lg border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <User className="w-6 h-6 text-primary" />
            Agregar Nuevo Cliente
          </DialogTitle>
          <DialogDescription>
            Registra un nuevo cliente en el sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Información Básica */}
          <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <User className="w-4 h-4" />
              Información Básica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Nombre Completo *
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreUsuario" className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Nombre de Usuario *
                </Label>
                <Input
                  id="nombreUsuario"
                  type="text"
                  value={formData.nombreUsuario}
                  onChange={(e) => handleChange('nombreUsuario', e.target.value)}
                  placeholder="Ej: juanperez"
                  required
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Se genera automáticamente desde el nombre
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono" className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Teléfono *
                </Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  placeholder="Ej: +57 300 123 4567"
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Contraseña *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="bg-background pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  El cliente usará esta contraseña para iniciar sesión
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Confirmar Contraseña *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Confirma la contraseña"
                    required
                    minLength={6}
                    className="bg-background pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Fecha de Nacimiento
                </Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Ciudad
                </Label>
                <Input
                  id="ciudad"
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => handleChange('ciudad', e.target.value)}
                  placeholder="Ej: Bogotá"
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <Star className="w-4 h-4" />
              Calificación Inicial
            </h3>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleChange('rating', star)}
                    className={`transition-all ${
                      star <= formData.rating 
                        ? 'text-primary scale-110' 
                        : 'text-muted-foreground hover:text-primary/50'
                    }`}
                  >
                    <Star className={`w-8 h-8 ${star <= formData.rating ? 'fill-primary' : ''}`} />
                  </button>
                ))}
                <span className="ml-2 font-semibold text-lg">{formData.rating}/5</span>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-primary">Información Adicional</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preferencias">Preferencias del Cliente</Label>
                <Textarea
                  id="preferencias"
                  value={formData.preferencias}
                  onChange={(e) => handleChange('preferencias', e.target.value)}
                  placeholder="Ej: Prefiere servicios en la tarde, le gusta la música suave..."
                  rows={3}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas Administrativas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => handleChange('notas', e.target.value)}
                  placeholder="Notas internas sobre el cliente (no visibles para modelos)..."
                  rows={3}
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}