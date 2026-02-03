import { useState, useEffect } from 'react';
import { X, Upload, User, Lock, Eye, EyeOff, AlertCircle, Edit, Plus, Trash2, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useModelos, Modelo } from '../src/app/components/ModelosContext';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

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
    documentoFrente: '',
    documentoReverso: '',
    edad: 21,
    altura: '',
    medidas: '',
    descripcion: '',
    sede: 'Sede Norte',
    fotosAdicionales: [] as string[],
    videos: [] as string[],
    activa: true,
    disponible: true,
    domicilio: true, // ✅ NUEVO CAMPO
    politicaTarifa: 1, // ✅ NUEVO: Política de tarifa (1, 2, 3)
  });
  
  // Estados para archivos nuevos (File objects)
  const [archivoFotoPerfil, setArchivoFotoPerfil] = useState<File | null>(null);
  const [archivoDocumentoFrente, setArchivoDocumentoFrente] = useState<File | null>(null);
  const [archivoDocumentoReverso, setArchivoDocumentoReverso] = useState<File | null>(null);
  const [archivosFotosAdicionales, setArchivosFotosAdicionales] = useState<File[]>([]);
  
  // Estados para previsualizaciones
  const [previsualizacionFotoPerfil, setPrevisualizacionFotoPerfil] = useState<string>('');
  const [previsualizacionDocFrente, setPrevisualizacionDocFrente] = useState<string>('');
  const [previsualizacionDocReverso, setPrevisualizacionDocReverso] = useState<string>('');
  const [previsualizacionesFotosAdicionales, setPrevisualizacionesFotosAdicionales] = useState<string[]>([]);
  
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nuevaFotoUrl, setNuevaFotoUrl] = useState('');
  const [nuevoVideoUrl, setNuevoVideoUrl] = useState('');

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
        documentoFrente: modelo.documentoFrente,
        documentoReverso: modelo.documentoReverso,
        edad: modelo.edad || 21,
        altura: modelo.altura || '',
        medidas: modelo.medidas || '',
        descripcion: modelo.descripcion || '',
        sede: modelo.sede || 'Sede Norte',
        fotosAdicionales: modelo.fotosAdicionales || [],
        videos: modelo.videos || [],
        activa: modelo.activa || true,
        disponible: modelo.disponible || true,
        domicilio: modelo.domicilio || true, // ✅ NUEVO CAMPO
        politicaTarifa: modelo.politicaTarifa || 1, // ✅ NUEVO: Política de tarifa (1, 2, 3)
      });
      
      // Cargar URLs existentes para previsualización
      setPrevisualizacionFotoPerfil(modelo.fotoPerfil);
      setPrevisualizacionDocFrente(modelo.documentoFrente);
      setPrevisualizacionDocReverso(modelo.documentoReverso);
      
      // Resetear archivos nuevos
      setArchivoFotoPerfil(null);
      setArchivoDocumentoFrente(null);
      setArchivoDocumentoReverso(null);
      setArchivosFotosAdicionales([]);
      setPrevisualizacionesFotosAdicionales([]);
    }
  }, [modelo]);

  // Manejar cambio de foto de perfil
  const handleFotoPerfilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setArchivoFotoPerfil(file);

    // Crear previsualización
    const reader = new FileReader();
    reader.onloadend = () => {
      setPrevisualizacionFotoPerfil(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Manejar cambio de documento frente
  const handleDocumentoFrenteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setArchivoDocumentoFrente(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPrevisualizacionDocFrente(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Manejar cambio de documento reverso
  const handleDocumentoReversoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setArchivoDocumentoReverso(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPrevisualizacionDocReverso(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Manejar selección de múltiples fotos adicionales
  const handleArchivosFotosAdicionalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = e.target.files;
    if (!archivos) return;

    const archivosValidos: File[] = [];
    const previsualizaciones: string[] = [];

    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];

      if (!archivo.type.startsWith('image/')) {
        toast.error(`El archivo ${archivo.name} no es una imagen válida`);
        continue;
      }

      if (archivo.size > 5 * 1024 * 1024) {
        toast.error(`El archivo ${archivo.name} no debe superar los 5MB`);
        continue;
      }

      archivosValidos.push(archivo);

      const reader = new FileReader();
      reader.onloadend = () => {
        previsualizaciones.push(reader.result as string);
        setPrevisualizacionesFotosAdicionales([...previsualizacionesFotosAdicionales, ...previsualizaciones]);
      };
      reader.readAsDataURL(archivo);
    }

    setArchivosFotosAdicionales([...archivosFotosAdicionales, ...archivosValidos]);
  };

  // Eliminar foto adicional nueva (de archivos pendientes)
  const eliminarFotoAdicionalNueva = (index: number) => {
    setArchivosFotosAdicionales(prev => prev.filter((_, i) => i !== index));
    setPrevisualizacionesFotosAdicionales(prev => prev.filter((_, i) => i !== index));
  };

  const agregarFotoAdicional = () => {
    if (nuevaFotoUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        fotosAdicionales: [...prev.fotosAdicionales, nuevaFotoUrl.trim()]
      }));
      setNuevaFotoUrl('');
      toast.success('Foto agregada a la galería');
    }
  };

  const eliminarFotoAdicional = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotosAdicionales: prev.fotosAdicionales.filter((_, i) => i !== index)
    }));
  };

  const agregarVideo = () => {
    if (nuevoVideoUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, nuevoVideoUrl.trim()]
      }));
      setNuevoVideoUrl('');
      toast.success('Video agregado');
    }
  };

  const eliminarVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  // Función para subir una imagen a Supabase Storage
  const subirImagenASupabase = async (archivo: File, tipo: string): Promise<string | null> => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017`;

      // Asegurar que el bucket existe
      const bucketResponse = await fetch(`${serverUrl}/upload/ensure-bucket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!bucketResponse.ok) {
        throw new Error('Error preparando almacenamiento');
      }

      // Convertir archivo a base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(archivo);
      });

      const fileName = `${formData.email.split('@')[0]}/${tipo}-${Date.now()}.${archivo.name.split('.').pop()}`;

      // Subir foto
      const uploadResponse = await fetch(`${serverUrl}/upload/foto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          fileName,
          fileData: base64Data,
          contentType: archivo.type
        })
      });

      if (!uploadResponse.ok) {
        throw new Error(`Error subiendo ${tipo}`);
      }

      const { url } = await uploadResponse.json();
      return url;
    } catch (error) {
      console.error(`Error subiendo ${tipo}:`, error);
      return null;
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
        edad: formData.edad,
        altura: formData.altura,
        medidas: formData.medidas,
        descripcion: formData.descripcion,
        sede: formData.sede,
        videos: formData.videos,
        activa: formData.activa,
        disponible: formData.disponible,
        domicilio: formData.domicilio, // ✅ NUEVO CAMPO
        politicaTarifa: formData.politicaTarifa, // ✅ NUEVO: Política de tarifa (1, 2, 3)
      };

      // Subir foto de perfil si hay un archivo nuevo
      if (archivoFotoPerfil) {
        console.log('📸 Subiendo nueva foto de perfil...');
        const urlFotoPerfil = await subirImagenASupabase(archivoFotoPerfil, 'perfil');
        if (urlFotoPerfil) {
          updateData.fotoPerfil = urlFotoPerfil;
          console.log('✅ Foto de perfil actualizada');
        } else {
          toast.warning('No se pudo actualizar la foto de perfil');
        }
      } else {
        // Mantener la foto actual
        updateData.fotoPerfil = formData.fotoPerfil;
      }

      // ❌ REMOVIDO: Subir documentos (no existen en la tabla)
      // if (archivoDocumentoFrente) { ... }
      // if (archivoDocumentoReverso) { ... }

      // Subir fotos adicionales nuevas
      const fotosAdicionalesUrls = [...formData.fotosAdicionales];
      
      if (archivosFotosAdicionales.length > 0) {
        console.log(`📸 Subiendo ${archivosFotosAdicionales.length} fotos adicionales...`);
        
        for (let i = 0; i < archivosFotosAdicionales.length; i++) {
          const archivo = archivosFotosAdicionales[i];
          const url = await subirImagenASupabase(archivo, `adicional-${i + 1}`);
          if (url) {
            fotosAdicionalesUrls.push(url);
            console.log(`✅ Foto adicional ${i + 1} subida`);
          }
        }
      }
      
      updateData.fotosAdicionales = fotosAdicionalesUrls;

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
      console.error('Error actualizando modelo:', error);
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
      documentoFrente: '',
      documentoReverso: '',
      edad: 21,
      altura: '',
      medidas: '',
      descripcion: '',
      sede: 'Sede Norte',
      fotosAdicionales: [],
      videos: [],
      activa: true,
      disponible: true,
      domicilio: true, // ✅ NUEVO CAMPO
      politicaTarifa: 1, // ✅ NUEVO: Política de tarifa (1, 2, 3)
    });
    
    // Resetear archivos y previsualizaciones
    setArchivoFotoPerfil(null);
    setArchivoDocumentoFrente(null);
    setArchivoDocumentoReverso(null);
    setArchivosFotosAdicionales([]);
    setPrevisualizacionFotoPerfil('');
    setPrevisualizacionDocFrente('');
    setPrevisualizacionDocReverso('');
    setPrevisualizacionesFotosAdicionales([]);
    
    setErrors({});
    setChangePassword(false);
    setShowPassword(false);
    onClose();
  };

  if (!modelo) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Modelo</DialogTitle>
          <DialogDescription>
            Modifica la información de {modelo.nombre}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basica" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basica">Información Básica</TabsTrigger>
              <TabsTrigger value="perfil">Perfil Público</TabsTrigger>
              <TabsTrigger value="multimedia">Fotos & Videos</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            {/* TAB: INFORMACIÓN BÁSICA */}
            <TabsContent value="basica" className="space-y-4">
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

                {/* ✅ NUEVO: Selector de Política de Tarifas */}
                <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <div className="mb-3">
                    <Label htmlFor="politicaTarifa" className="font-medium text-base">
                      💰 Política de Tarifas
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecciona el nivel de tarifas que aplicará automáticamente a esta modelo
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {/* Política 1 - Económica */}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, politicaTarifa: 1 }))}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.politicaTarifa === 1
                          ? 'border-primary bg-primary/20 shadow-md'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">Política 1</span>
                        {formData.politicaTarifa === 1 && (
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Económica</p>
                      <p className="text-xs font-mono text-primary">1h: $160k</p>
                      <p className="text-xs font-mono text-primary/80">2h: $300k</p>
                    </button>

                    {/* Política 2 - Estándar */}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, politicaTarifa: 2 }))}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.politicaTarifa === 2
                          ? 'border-primary bg-primary/20 shadow-md'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">Política 2</span>
                        {formData.politicaTarifa === 2 && (
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Estándar</p>
                      <p className="text-xs font-mono text-primary">1h: $190k</p>
                      <p className="text-xs font-mono text-primary/80">2h: $360k</p>
                    </button>

                    {/* Política 3 - Premium */}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, politicaTarifa: 3 }))}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.politicaTarifa === 3
                          ? 'border-primary bg-primary/20 shadow-md'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">Política 3</span>
                        {formData.politicaTarifa === 3 && (
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Premium ⭐</p>
                      <p className="text-xs font-mono text-primary">1h: $200k</p>
                      <p className="text-xs font-mono text-primary/80">2h: $380k</p>
                    </button>
                  </div>

                  <div className="mt-3 p-2 bg-blue-950/20 border border-blue-500/30 rounded text-xs text-blue-300">
                    <strong>💡 Nota:</strong> Al seleccionar una política, las tarifas se aplicarán automáticamente a la modelo en la landing page.
                  </div>
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
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta descripción aparecerá en el perfil público de la página web
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TAB: FOTOS & VIDEOS */}
            <TabsContent value="multimedia" className="space-y-4">
              {/* Foto de Perfil Principal */}
              <div>
                <Label>Foto de Perfil Principal</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoPerfilChange}
                    className="hidden"
                    id="fotoPerfil"
                  />
                  <label
                    htmlFor="fotoPerfil"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors border-border"
                  >
                    {previsualizacionFotoPerfil ? (
                      <div className="relative w-full h-full">
                        <img src={previsualizacionFotoPerfil} alt="Preview" className="h-full w-auto mx-auto object-contain rounded-lg" />
                        {archivoFotoPerfil && (
                          <Badge className="absolute top-2 right-2 bg-green-600">Nueva foto</Badge>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click para cambiar foto de perfil</p>
                      </div>
                    )}
                  </label>
                  
                  {archivoFotoPerfil && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Nueva foto seleccionada: {archivoFotoPerfil.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Galería de Fotos Adicionales */}
              <div>
                <Label>Galería de Fotos Adicionales</Label>
                <p className="text-xs text-muted-foreground mb-2">Sube múltiples fotos o ingresa URLs</p>
                
                {/* Subir archivos */}
                <div className="mb-3">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleArchivosFotosAdicionalesChange}
                    className="cursor-pointer"
                  />
                </div>

                {/* Mostrar archivos nuevos pendientes de subir */}
                {archivosFotosAdicionales.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-green-600 mb-2 flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      {archivosFotosAdicionales.length} foto(s) nueva(s) seleccionada(s)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {archivosFotosAdicionales.map((archivo, index) => (
                        <div key={`nuevo-${index}`} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-green-500">
                            <img 
                              src={previsualizacionesFotosAdicionales[index] || URL.createObjectURL(archivo)} 
                              alt={`Nueva ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Badge className="absolute top-1 left-1 bg-green-600 text-xs">Nueva</Badge>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 rounded-full w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => eliminarFotoAdicionalNueva(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Agregar por URL */}
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="https://ejemplo.com/foto.jpg o URL de foto"
                    value={nuevaFotoUrl}
                    onChange={(e) => setNuevaFotoUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        agregarFotoAdicional();
                      }
                    }}
                  />
                  <Button type="button" onClick={agregarFotoAdicional} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Mostrar fotos existentes */}
                {formData.fotosAdicionales && formData.fotosAdicionales.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Fotos existentes:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {formData.fotosAdicionales.map((url, index) => (
                        <Card key={`existente-${index}`} className="relative">
                          <CardContent className="p-2">
                            <img src={url} alt={`Foto ${index + 1}`} className="w-full h-24 object-cover rounded" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => eliminarFotoAdicional(index)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Videos */}
              <div>
                <Label>Videos del Perfil</Label>
                <p className="text-xs text-muted-foreground mb-2">URLs de videos para mostrar en el perfil</p>
                
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="https://youtube.com/watch?v=... o URL directa"
                    value={nuevoVideoUrl}
                    onChange={(e) => setNuevoVideoUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        agregarVideo();
                      }
                    }}
                  />
                  <Button type="button" onClick={agregarVideo} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.videos && formData.videos.length > 0 && (
                  <div className="space-y-2">
                    {formData.videos.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded">
                        <Video className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm flex-1 truncate">{url}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => eliminarVideo(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB: DOCUMENTOS */}
            <TabsContent value="documentos" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Documento Frente */}
                <div>
                  <Label>Documento Identidad (Frente)</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDocumentoFrenteChange}
                    className="hidden"
                    id="documentoFrente"
                  />
                  <label
                    htmlFor="documentoFrente"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors border-border"
                  >
                    {previsualizacionDocFrente ? (
                      <div className="relative w-full h-full">
                        <img src={previsualizacionDocFrente} alt="Documento Frente" className="h-full w-auto mx-auto object-contain rounded-lg" />
                        {archivoDocumentoFrente && (
                          <Badge className="absolute top-2 right-2 bg-green-600">Nuevo</Badge>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Frente del documento</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Documento Reverso */}
                <div>
                  <Label>Documento Identidad (Reverso)</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDocumentoReversoChange}
                    className="hidden"
                    id="documentoReverso"
                  />
                  <label
                    htmlFor="documentoReverso"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors border-border"
                  >
                    {previsualizacionDocReverso ? (
                      <div className="relative w-full h-full">
                        <img src={previsualizacionDocReverso} alt="Documento Reverso" className="h-full w-auto mx-auto object-contain rounded-lg" />
                        {archivoDocumentoReverso && (
                          <Badge className="absolute top-2 right-2 bg-green-600">Nuevo</Badge>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Reverso del documento</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-300 font-medium">Documentos Confidenciales</p>
                    <p className="text-xs text-yellow-300/80 mt-1">
                      Los documentos son solo para verificación interna. No se mostrarán en la página web.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Botones de Acción */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Badge variant="outline" className="text-xs">
              * Campos obligatorios
            </Badge>
            <div className="flex gap-2">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}