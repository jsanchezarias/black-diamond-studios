import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase/info'; // ✅ Corregido: ruta correcta
import { useModelos, Modelo } from './ModelosContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Upload, Edit, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { GaleriaFotosModelo } from '../../components/GaleriaFotosModelo';

interface EditarModeloModalProps {
  open: boolean;
  onClose: () => void;
  modelo: Modelo | null;
}

export function EditarModeloModal({ open, onClose, modelo }: EditarModeloModalProps) {
  const { modelos, actualizarModelo } = useModelos();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    nombreArtistico: '',
    cedula: '',
    telefono: '',
    direccion: '',
    email: '',
    password: '',
    fotoPerfil: '',
    edad: 21,
    altura: '',
    medidas: '',
    descripcion: '',
    sede: 'Sede Norte',
    activa: true,
    disponible: true,
    domicilio: true,
    politicaTarifa: 1,
    documento_tipo: 'cedula',
    documento_numero: '',
    documentoFrente: '',
    documentoReverso: '',
    documento_verificado: false,
  });

  const [fotoPerfil, setFotoPerfil] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subiendoDoc, setSubiendoDoc] = useState<'frente' | 'reverso' | null>(null);

  // Cargar datos del modelo cuando cambia
  useEffect(() => {
    if (modelo) {
      setFormData({
        nombre: modelo.nombre,
        nombreArtistico: modelo.nombreArtistico,
        cedula: modelo.cedula,
        telefono: modelo.telefono,
        direccion: modelo.direccion,
        email: modelo.email,
        password: modelo.password,
        fotoPerfil: modelo.fotoPerfil,
        edad: modelo.edad || 21,
        altura: modelo.altura || '',
        medidas: modelo.medidas || '',
        descripcion: modelo.descripcion || '',
        sede: modelo.sede || 'Sede Norte',
        activa: modelo.activa ?? true,
        disponible: modelo.disponible ?? true,
        domicilio: modelo.domicilio ?? true,
        politicaTarifa: modelo.politicaTarifa || 1,
        documento_tipo: modelo.documento_tipo || 'cedula',
        documento_numero: modelo.documento_numero || '',
        documentoFrente: modelo.documentoFrente || '',
        documentoReverso: modelo.documentoReverso || '',
        documento_verificado: modelo.documento_verificado || false,
      });
      setFotoPerfil(modelo.fotoPerfil);
    }
  }, [modelo]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFotoPerfil(result);
        setFormData(prev => ({ ...prev, fotoPerfil: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const subirDocumento = async (e: React.ChangeEvent<HTMLInputElement>, cara: 'frente' | 'reverso') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede superar 5MB');
      return;
    }

    setSubiendoDoc(cara);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `modelo-${modelo!.id}-${cara}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const campo = cara === 'frente' ? 'documentoFrente' : 'documentoReverso';
      setFormData(prev => ({ ...prev, [campo]: fileName }));
      toast.success(`Documento ${cara === 'frente' ? 'frontal' : 'posterior'} cargado`);
    } catch (err) {
      toast.error('Error al subir documento');
    } finally {
      setSubiendoDoc(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modelo) return;

    // Reset errors
    setErrors({});

    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.nombre) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.email) newErrors.email = 'El email es obligatorio';
    if (!formData.fotoPerfil) newErrors.fotoPerfil = 'La foto de perfil es obligatoria';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    // Validate duplicate email (except current modelo)
    if (formData.email && modelos.some(m => m.id !== modelo.id && m.email.toLowerCase() === formData.email.toLowerCase())) {
      newErrors.email = 'Este email ya está registrado';
    }

    // Validate password if changing
    if (changePassword) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es obligatoria';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }

    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);

    try {
      // Preparar datos de actualización
      const updateData: Partial<Modelo> = {
        nombre: formData.nombre,
        nombreArtistico: formData.nombreArtistico,
        cedula: formData.cedula,
        telefono: formData.telefono,
        direccion: formData.direccion,
        email: formData.email,
        fotoPerfil: formData.fotoPerfil,
        edad: formData.edad,
        altura: formData.altura,
        medidas: formData.medidas,
        descripcion: formData.descripcion,
        sede: formData.sede,
        activa: formData.activa,
        disponible: formData.disponible,
        domicilio: formData.domicilio,
        politicaTarifa: formData.politicaTarifa,
        documento_tipo: formData.documento_tipo,
        documento_numero: formData.documento_numero,
        documentoFrente: formData.documentoFrente || undefined,
        documentoReverso: formData.documentoReverso || undefined,
        documento_verificado: formData.documento_verificado,
        documento_fecha_subida: (formData.documentoFrente || formData.documentoReverso)
          ? new Date().toISOString()
          : undefined,
      };

      // Only update password if changing
      if (changePassword) {
        updateData.password = formData.password;
      }

      // Actualizar modelo en la base de datos
      await actualizarModelo(modelo.id, updateData);
      
      // ✅ Las tarifas se actualizan automáticamente porque ahora se leen dinámicamente
      // de la tabla politicas_tarifas_servicios según el campo politica_tarifa
      // YA NO es necesario llamar a aplicar_politica_tarifa() porque no duplicamos datos
      
      toast.success(`✅ Modelo actualizada exitosamente!`, {
        description: `${formData.nombre} ha sido actualizada correctamente.`
      });
      
      handleClose();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error actualizando modelo:', error);
      toast.error(`❌ Error al actualizar modelo`, {
        description: 'Hubo un problema al guardar los cambios. Por favor intenta de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      nombreArtistico: '',
      cedula: '',
      telefono: '',
      direccion: '',
      email: '',
      password: '',
      fotoPerfil: '',
      edad: 21,
      altura: '',
      medidas: '',
      descripcion: '',
      sede: 'Sede Norte',
      activa: true,
      disponible: true,
      domicilio: true,
      politicaTarifa: 1,
      documento_tipo: 'cedula',
      documento_numero: '',
      documentoFrente: '',
      documentoReverso: '',
      documento_verificado: false,
    });
    setFotoPerfil('');
    setErrors({});
    setChangePassword(false);
    setShowPassword(false);
    onClose();
  };

  if (!modelo) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card backdrop-blur-lg border-primary/30 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Editar Modelo</DialogTitle>
          <DialogDescription>
            Modifica la información de {modelo.nombre}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basica" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basica">Información Básica</TabsTrigger>
              <TabsTrigger value="perfil">Perfil Público</TabsTrigger>
              <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="galeria">Galería</TabsTrigger>
            </TabsList>

            {/* TAB: INFORMACIÓN BÁSICA */}
            <TabsContent value="basica" className="space-y-4">
              {/* Foto de Perfil */}
              <div className="flex justify-center mb-4">
                <div className="w-48 space-y-2">
                  <Label htmlFor="fotoPerfil">
                    Foto de Perfil <span className="text-destructive">*</span>
                  </Label>
                  
                  {fotoPerfil ? (
                    <div className="relative">
                      <div className="aspect-square w-full rounded-lg overflow-hidden border-2 border-primary/30">
                        <img 
                          src={fotoPerfil} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                        onClick={() => {
                          document.getElementById('fotoPerfil')?.click();
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors bg-background/50">
                      <input
                        id="fotoPerfil"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label 
                        htmlFor="fotoPerfil" 
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Subir imagen</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG o WEBP</p>
                      </label>
                    </div>
                  )}
                  <input
                    id="fotoPerfil"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {errors.fotoPerfil && (
                    <div className="flex items-center gap-1 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.fotoPerfil}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    className={errors.nombre ? 'border-red-500' : ''}
                  />
                  {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
                </div>

                <div>
                  <Label htmlFor="nombreArtistico">Nombre Artístico</Label>
                  <Input
                    id="nombreArtistico"
                    value={formData.nombreArtistico}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombreArtistico: e.target.value }))}
                    placeholder="Mismo que nombre completo si no tiene"
                  />
                </div>

                <div>
                  <Label htmlFor="cedula">Cédula</Label>
                  <Input
                    id="cedula"
                    value={formData.cedula}
                    onChange={(e) => setFormData(prev => ({ ...prev, cedula: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+57 300 123 4567"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Calle 123 #45-67, Bogotá"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <button
                      type="button"
                      onClick={() => setChangePassword(!changePassword)}
                      className="text-xs text-primary hover:underline"
                    >
                      {changePassword ? 'Cancelar cambio' : 'Cambiar contraseña'}
                    </button>
                  </div>
                  {changePassword ? (
                    <>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                    </>
                  ) : (
                    <div className="flex items-center h-9 px-3 rounded-md border border-input bg-secondary text-muted-foreground text-sm">
                      ••••••••
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="edad">Edad</Label>
                  <Input
                    id="edad"
                    type="number"
                    min="18"
                    max="50"
                    value={formData.edad}
                    onChange={(e) => setFormData(prev => ({ ...prev, edad: parseInt(e.target.value) || 21 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="sede">Sede</Label>
                  <select
                    id="sede"
                    value={formData.sede}
                    onChange={(e) => setFormData(prev => ({ ...prev, sede: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Sede Norte">Sede Norte</option>
                    <option value="Sede Sur">Sede Sur</option>
                    <option value="Sede Centro">Sede Centro</option>
                  </select>
                </div>
              </div>

              {/* Switches de Estado */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <Label htmlFor="activa" className="cursor-pointer font-medium">
                      Estado Activa
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      ¿La modelo está activa en el sistema?
                    </p>
                  </div>
                  <Switch
                    id="activa"
                    checked={formData.activa}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activa: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <Label htmlFor="disponible" className="cursor-pointer font-medium">
                      Disponible Ahora
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      ¿La modelo está disponible para atender clientes en este momento?
                    </p>
                  </div>
                  <Switch
                    id="disponible"
                    checked={formData.disponible}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, disponible: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <Label htmlFor="domicilio" className="cursor-pointer font-medium">
                      Presta Servicio a Domicilio
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      ¿La modelo hace domicilios o solo trabaja en sede?
                    </p>
                  </div>
                  <Switch
                    id="domicilio"
                    checked={formData.domicilio}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, domicilio: checked }))}
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB: PERFIL PÚBLICO */}
            <TabsContent value="perfil" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="altura">Altura</Label>
                  <Input
                    id="altura"
                    value={formData.altura}
                    onChange={(e) => setFormData(prev => ({ ...prev, altura: e.target.value }))}
                    placeholder="165 cm"
                  />
                </div>

                <div>
                  <Label htmlFor="medidas">Medidas</Label>
                  <Input
                    id="medidas"
                    value={formData.medidas}
                    onChange={(e) => setFormData(prev => ({ ...prev, medidas: e.target.value }))}
                    placeholder="90-60-90"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="descripcion">Descripción para la Página Web</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Describe las características, personalidad y atractivos de la modelo para mostrar en la página web..."
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta descripción aparecerá en el perfil público de la página web
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TAB: TARIFAS */}
            <TabsContent value="tarifas" className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="mb-4">
                  <Label htmlFor="politicaTarifa" className="font-medium text-base">
                    💰 Política de Tarifas
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecciona el nivel de tarifas para servicio en sede. Las tarifas a domicilio son estándar para todas las políticas.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Política 1 - Económica */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, politicaTarifa: 1 }))}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.politicaTarifa === 1
                        ? 'border-primary bg-primary/20 shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">Política 1</span>
                      {formData.politicaTarifa === 1 && (
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Económica 💚</p>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-primary/70 mb-1">EN SEDE:</p>
                      <p className="text-sm font-mono text-primary">Rato: $100k</p>
                      <p className="text-sm font-mono text-primary">30 min: $130k</p>
                      <p className="text-sm font-mono text-primary">1h: $160k</p>
                      <p className="text-sm font-mono text-primary/80">2h: $300k</p>
                      <p className="text-xs text-muted-foreground mt-2">+ 5 duraciones más</p>
                    </div>
                  </button>

                  {/* Política 2 - Estándar */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, politicaTarifa: 2 }))}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.politicaTarifa === 2
                        ? 'border-primary bg-primary/20 shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">Política 2</span>
                      {formData.politicaTarifa === 2 && (
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Estándar 💙</p>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-primary/70 mb-1">EN SEDE:</p>
                      <p className="text-sm font-mono text-primary">Rato: $130k</p>
                      <p className="text-sm font-mono text-primary">30 min: $160k</p>
                      <p className="text-sm font-mono text-primary">1h: $190k</p>
                      <p className="text-sm font-mono text-primary/80">2h: $360k</p>
                      <p className="text-xs text-muted-foreground mt-2">+ 5 duraciones más</p>
                    </div>
                  </button>

                  {/* Política 3 - Premium */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, politicaTarifa: 3 }))}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.politicaTarifa === 3
                        ? 'border-primary bg-primary/20 shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">Política 3</span>
                      {formData.politicaTarifa === 3 && (
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Premium ⭐</p>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-primary/70 mb-1">EN SEDE:</p>
                      <p className="text-sm font-mono text-primary">Rato: $150k</p>
                      <p className="text-sm font-mono text-primary">30 min: $180k</p>
                      <p className="text-sm font-mono text-primary">1h: $220k</p>
                      <p className="text-sm font-mono text-primary/80">2h: $420k</p>
                      <p className="text-xs text-muted-foreground mt-2">+ 5 duraciones más</p>
                    </div>
                  </button>
                </div>

                {/* Tarifas a Domicilio Estándar */}
                <div className="mt-4 p-4 bg-gradient-to-r from-amber-950/30 to-amber-900/20 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🏠</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-200 mb-2">Tarifas a Domicilio (Desde 1 hora en adelante)</h4>
                      <p className="text-xs text-amber-300/70 mb-3">
                        ⚠️ Rato y 30 minutos solo están disponibles en sede. El servicio a domicilio comienza desde 1 hora.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="bg-background/20 p-2 rounded">
                          <p className="text-muted-foreground">1h</p>
                          <p className="font-mono text-amber-300">$250k</p>
                        </div>
                        <div className="bg-background/20 p-2 rounded">
                          <p className="text-muted-foreground">2h</p>
                          <p className="font-mono text-amber-300">$480k</p>
                        </div>
                        <div className="bg-background/20 p-2 rounded">
                          <p className="text-muted-foreground">3h</p>
                          <p className="font-mono text-amber-300">$690k</p>
                        </div>
                        <div className="bg-background/20 p-2 rounded">
                          <p className="text-muted-foreground">6h</p>
                          <p className="font-mono text-amber-300">$1.2M</p>
                        </div>
                        <div className="bg-background/20 p-2 rounded">
                          <p className="text-muted-foreground">8h</p>
                          <p className="font-mono text-amber-300">$1.5M</p>
                        </div>
                        <div className="bg-background/20 p-2 rounded">
                          <p className="text-muted-foreground">12h</p>
                          <p className="font-mono text-amber-300">$2M</p>
                        </div>
                        <div className="bg-background/20 p-2 rounded">
                          <p className="text-muted-foreground">24h</p>
                          <p className="font-mono text-amber-300">$2.5M</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-950/20 border border-blue-500/30 rounded text-xs text-blue-300">
                  <strong>💡 Nota:</strong> Al seleccionar una política, las tarifas se aplicarán automáticamente a la modelo en la landing page cuando guardes los cambios. La política solo afecta los precios en sede, las tarifas a domicilio son fijas.
                </div>
              </div>
            </TabsContent>
            {/* TAB: DOCUMENTOS */}
            <TabsContent value="documentos" className="space-y-4">
              {/* Sección: Documento de Identidad */}
              <div className="border border-white/10 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <span>🪪</span> Documento de Identidad
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Tipo de documento */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Tipo de documento</label>
                    <select
                      value={formData.documento_tipo}
                      onChange={e => setFormData(prev => ({ ...prev, documento_tipo: e.target.value }))}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="cedula">Cédula de Ciudadanía</option>
                      <option value="pasaporte">Pasaporte</option>
                      <option value="extranjeria">Cédula de Extranjería</option>
                    </select>
                  </div>

                  {/* Número de documento */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Número de documento</label>
                    <Input
                      type="text"
                      placeholder="Ej: 1234567890"
                      value={formData.documento_numero}
                      onChange={e => setFormData(prev => ({ ...prev, documento_numero: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Zona de carga */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Cara frontal */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Cara frontal</label>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={e => subirDocumento(e, 'frente')}
                        disabled={subiendoDoc !== null}
                      />
                      <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                        formData.documentoFrente
                          ? 'border-green-500/40 bg-green-500/5'
                          : 'border-border hover:border-primary/50'
                      }`}>
                        {subiendoDoc === 'frente' ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                            <span className="text-xs text-muted-foreground">Subiendo...</span>
                          </div>
                        ) : formData.documentoFrente ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">✅</span>
                            <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Cargado</Badge>
                            <span className="text-xs text-muted-foreground">Clic para cambiar</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 py-2">
                            <Upload className="w-8 h-8 text-muted-foreground mb-1" />
                            <span className="text-xs font-medium">Cara frontal</span>
                            <span className="text-xs text-muted-foreground">JPG, PNG o PDF · máx 5MB</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Cara posterior */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Cara posterior</label>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={e => subirDocumento(e, 'reverso')}
                        disabled={subiendoDoc !== null}
                      />
                      <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                        formData.documentoReverso
                          ? 'border-green-500/40 bg-green-500/5'
                          : 'border-border hover:border-primary/50'
                      }`}>
                        {subiendoDoc === 'reverso' ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                            <span className="text-xs text-muted-foreground">Subiendo...</span>
                          </div>
                        ) : formData.documentoReverso ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">✅</span>
                            <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Cargado</Badge>
                            <span className="text-xs text-muted-foreground">Clic para cambiar</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 py-2">
                            <Upload className="w-8 h-8 text-muted-foreground mb-1" />
                            <span className="text-xs font-medium">Cara posterior</span>
                            <span className="text-xs text-muted-foreground">JPG, PNG o PDF · máx 5MB</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Estado de verificación */}
                {(formData.documentoFrente && formData.documentoReverso) && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                    <div className="flex items-center gap-2">
                      <span>{formData.documento_verificado ? '✅' : '📋'}</span>
                      <span className="text-xs text-muted-foreground">
                        {formData.documento_verificado
                          ? 'Documentos verificados'
                          : 'Documentos cargados, pendiente verificación'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, documento_verificado: !prev.documento_verificado }))}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        formData.documento_verificado
                          ? 'border-green-500/50 text-green-400 bg-green-500/10'
                          : 'border-amber-500/50 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                      }`}
                    >
                      {formData.documento_verificado ? 'Verificado ✓' : 'Marcar verificado'}
                    </button>
                  </div>
                )}

                <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-yellow-300 font-medium">Documentos Confidenciales</p>
                      <p className="text-xs text-yellow-300/80 mt-0.5">
                        Los documentos son solo para verificación interna. No se mostrarán en la página web.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: GALERÍA */}
            <TabsContent value="galeria" className="space-y-4">
              <div className="border border-white/10 rounded-xl p-4">
                <GaleriaFotosModelo
                  modeloEmail={modelo.email}
                  soloLectura={false}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
