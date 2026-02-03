import { useState } from 'react';
import { X, Upload, User, Lock, Eye, EyeOff, AlertCircle, Plus, Trash2, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useModelos, ModeloData } from '../src/app/components/ModelosContext';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

interface NuevaModeloModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (modelo: ModeloData) => void;
}

export function NuevaModeloModal({ open, onClose, onSave }: NuevaModeloModalProps) {
  const { modelos } = useModelos();
  const [formData, setFormData] = useState<ModeloData>({
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
  });
  
  const [fotoPerfil, setFotoPerfil] = useState<string>('');
  const [documentoFrente, setDocumentoFrente] = useState<string>('');
  const [documentoReverso, setDocumentoReverso] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nuevaFotoUrl, setNuevaFotoUrl] = useState('');
  const [nuevoVideoUrl, setNuevoVideoUrl] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'perfil' | 'frente' | 'reverso') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (tipo === 'perfil') {
          setFotoPerfil(result);
          setFormData(prev => ({ ...prev, fotoPerfil: result }));
        } else if (tipo === 'frente') {
          setDocumentoFrente(result);
          setFormData(prev => ({ ...prev, documentoFrente: result }));
        } else {
          setDocumentoReverso(result);
          setFormData(prev => ({ ...prev, documentoReverso: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const agregarFotoAdicional = () => {
    if (nuevaFotoUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        fotosAdicionales: [...(prev.fotosAdicionales || []), nuevaFotoUrl.trim()]
      }));
      setNuevaFotoUrl('');
      toast.success('Foto agregada a la galería');
    }
  };

  const eliminarFotoAdicional = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotosAdicionales: (prev.fotosAdicionales || []).filter((_, i) => i !== index)
    }));
  };

  const agregarVideo = () => {
    if (nuevoVideoUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        videos: [...(prev.videos || []), nuevoVideoUrl.trim()]
      }));
      setNuevoVideoUrl('');
      toast.success('Video agregado');
    }
  };

  const eliminarVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: (prev.videos || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});

    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.nombre) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.cedula) newErrors.cedula = 'La cédula es obligatoria';
    if (!formData.telefono) newErrors.telefono = 'El teléfono es obligatorio';
    if (!formData.email) newErrors.email = 'El email es obligatorio';
    if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
    if (!formData.fotoPerfil) newErrors.fotoPerfil = 'La foto de perfil es obligatoria';
    if (!formData.documentoFrente) newErrors.documentoFrente = 'El documento (frente) es obligatorio';
    if (!formData.documentoReverso) newErrors.documentoReverso = 'El documento (reverso) es obligatorio';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    // Validate duplicate email
    if (formData.email && modelos.some(m => m.email.toLowerCase() === formData.email.toLowerCase())) {
      newErrors.email = 'Este email ya está registrado';
    }

    // Validate duplicate cedula
    if (formData.cedula && modelos.some(m => m.cedula === formData.cedula)) {
      newErrors.cedula = 'Esta cédula ya está registrada';
    }

    // Validate password length
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    onSave(formData);
    
    // Reset form
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
    });
    setFotoPerfil('');
    setDocumentoFrente('');
    setDocumentoReverso('');
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">✨ Nueva Modelo</DialogTitle>
          <DialogDescription>
            Completa toda la información para crear el perfil completo (gestión + página web)
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
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input
                    id="cedula"
                    value={formData.cedula}
                    onChange={(e) => setFormData(prev => ({ ...prev, cedula: e.target.value }))}
                    className={errors.cedula ? 'border-red-500' : ''}
                  />
                  {errors.cedula && <p className="text-xs text-red-500 mt-1">{errors.cedula}</p>}
                </div>

                <div>
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    className={errors.telefono ? 'border-red-500' : ''}
                    placeholder="+57 300 123 4567"
                  />
                  {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
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
                  <Label htmlFor="password">Contraseña *</Label>
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
                <Label>Foto de Perfil Principal *</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'perfil')}
                    className="hidden"
                    id="fotoPerfil"
                  />
                  <label
                    htmlFor="fotoPerfil"
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors ${
                      errors.fotoPerfil ? 'border-red-500' : 'border-border'
                    }`}
                  >
                    {fotoPerfil ? (
                      <img src={fotoPerfil} alt="Preview" className="h-full w-auto object-contain rounded-lg" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click para subir foto de perfil</p>
                      </div>
                    )}
                  </label>
                  {errors.fotoPerfil && <p className="text-xs text-red-500 mt-1">{errors.fotoPerfil}</p>}
                  
                  {/* URL alternativa */}
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">O ingresa URL de la foto:</Label>
                    <Input
                      placeholder="https://ejemplo.com/foto.jpg o Google Drive link"
                      value={formData.fotoPerfil.startsWith('data:') ? '' : formData.fotoPerfil}
                      onChange={(e) => setFormData(prev => ({ ...prev, fotoPerfil: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Galería de Fotos Adicionales */}
              <div>
                <Label>Galería de Fotos Adicionales</Label>
                <p className="text-xs text-muted-foreground mb-2">URLs de fotos para mostrar en el perfil de la página web</p>
                
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="https://ejemplo.com/foto.jpg o Google Drive link"
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

                {formData.fotosAdicionales && formData.fotosAdicionales.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.fotosAdicionales.map((url, index) => (
                      <Card key={index} className="relative">
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
                  <Label>Documento Identidad (Frente) *</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'frente')}
                    className="hidden"
                    id="documentoFrente"
                  />
                  <label
                    htmlFor="documentoFrente"
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors ${
                      errors.documentoFrente ? 'border-red-500' : 'border-border'
                    }`}
                  >
                    {documentoFrente ? (
                      <img src={documentoFrente} alt="Documento Frente" className="h-full w-auto object-contain rounded-lg" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Frente del documento</p>
                      </div>
                    )}
                  </label>
                  {errors.documentoFrente && <p className="text-xs text-red-500 mt-1">{errors.documentoFrente}</p>}
                </div>

                {/* Documento Reverso */}
                <div>
                  <Label>Documento Identidad (Reverso) *</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'reverso')}
                    className="hidden"
                    id="documentoReverso"
                  />
                  <label
                    htmlFor="documentoReverso"
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors ${
                      errors.documentoReverso ? 'border-red-500' : 'border-border'
                    }`}
                  >
                    {documentoReverso ? (
                      <img src={documentoReverso} alt="Documento Reverso" className="h-full w-auto object-contain rounded-lg" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Reverso del documento</p>
                      </div>
                    )}
                  </label>
                  {errors.documentoReverso && <p className="text-xs text-red-500 mt-1">{errors.documentoReverso}</p>}
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
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <User className="w-4 h-4 mr-2" />
                Crear Modelo
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
