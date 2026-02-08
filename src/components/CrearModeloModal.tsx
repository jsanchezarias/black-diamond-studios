import { Switch } from './ui/switch';
import { UserPlus, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../src/utils/supabase/info'; // ✅ Corregido: ruta correcta
import { useModelos } from '../src/app/components/ModelosContext';
import { toast } from 'sonner@2.0.3';
import { CredencialesModal } from './CredencialesModal';

interface CrearModeloModalProps {
  open: boolean;
  onClose: () => void;
}

export function CrearModeloModal({ open, onClose }: CrearModeloModalProps) {
  const { agregarModelo, recargarModelos } = useModelos();
  const [loading, setLoading] = useState(false);
  
  // Datos del perfil de la modelo
  const [nombre, setNombre] = useState('');
  const [nombreArtistico, setNombreArtistico] = useState('');
  const [edad, setEdad] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cedula, setCedula] = useState('');
  const [direccion, setDireccion] = useState('');
  const [altura, setAltura] = useState('');
  const [medidas, setMedidas] = useState('');
  const [sede, setSede] = useState('Sede Zona Norte');
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activa, setActiva] = useState(true);
  const [disponible, setDisponible] = useState(true);
  const [domicilio, setDomicilio] = useState(true); // ✅ NUEVO CAMPO
  const [politicaTarifa, setPoliticaTarifa] = useState(2); // ✅ NUEVO: Política tarifaria (1=Económica, 2=Estándar, 3=Premium)
  
  // Archivo de foto
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [archivosFotosAdicionales, setArchivosFotosAdicionales] = useState<File[]>([]);
  const [previsualizacionFoto, setPrevisualizacionFoto] = useState<string>('');
  const [previsualizacionesFotosAdicionales, setPrevisualizacionesFotosAdicionales] = useState<string[]>([]);
  
  // ✅ NUEVO: Archivos de documentos de identidad
  const [archivoDocumentoFrente, setArchivoDocumentoFrente] = useState<File | null>(null);
  const [archivoDocumentoReverso, setArchivoDocumentoReverso] = useState<File | null>(null);
  const [previsualizacionDocFrente, setPrevisualizacionDocFrente] = useState<string>('');
  const [previsualizacionDocReverso, setPrevisualizacionDocReverso] = useState<string>('');
  
  // Datos de credenciales
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  
  // Modal de credenciales
  const [mostrarCredenciales, setMostrarCredenciales] = useState(false);
  const [credencialesCreadas, setCredencialesCreadas] = useState({
    nombre: '',
    email: '',
    password: ''
  });

  const resetForm = () => {
    setNombre('');
    setNombreArtistico('');
    setEdad('');
    setEmail('');
    setTelefono('');
    setCedula('');
    setDireccion('');
    setAltura('');
    setMedidas('');
    setSede('Sede Zona Norte');
    setFotoPerfil('');
    setDescripcion('');
    setActiva(true);
    setDisponible(true);
    setDomicilio(true); // ✅ NUEVO CAMPO
    setPoliticaTarifa(2); // ✅ NUEVO: Reset a política Estándar por defecto
    setPassword('');
    setConfirmarPassword('');
    setArchivoFoto(null);
    setPrevisualizacionFoto('');
    setArchivosFotosAdicionales([]);
    setPrevisualizacionesFotosAdicionales([]);
    setArchivoDocumentoFrente(null);
    setPrevisualizacionDocFrente('');
    setArchivoDocumentoReverso(null);
    setPrevisualizacionDocReverso('');
  };

  // Manejar selección de archivo de foto
  const handleArchivoFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Validar que sea una imagen
    if (!archivo.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (archivo.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setArchivoFoto(archivo);

    // Crear previsualización
    const reader = new FileReader();
    reader.onloadend = () => {
      setPrevisualizacionFoto(reader.result as string);
    };
    reader.readAsDataURL(archivo);
  };

  // Manejar selección de archivos de fotos adicionales
  const handleArchivosFotosAdicionalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = e.target.files;
    if (!archivos) return;

    const archivosValidos: File[] = [];
    const previsualizaciones: string[] = [];

    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];

      // Validar que sea una imagen
      if (!archivo.type.startsWith('image/')) {
        toast.error(`El archivo ${archivo.name} no es una imagen válida`);
        continue;
      }

      // Validar tamaño (máximo 5MB)
      if (archivo.size > 5 * 1024 * 1024) {
        toast.error(`El archivo ${archivo.name} no debe superar los 5MB`);
        continue;
      }

      archivosValidos.push(archivo);

      // Crear previsualización
      const reader = new FileReader();
      reader.onloadend = () => {
        previsualizaciones.push(reader.result as string);
        setPrevisualizacionesFotosAdicionales([...previsualizaciones]);
      };
      reader.readAsDataURL(archivo);
    }

    setArchivosFotosAdicionales([...archivosFotosAdicionales, ...archivosValidos]);
  };

  // ✅ NUEVO: Manejar selección de archivo de documento de identidad (frente)
  const handleArchivoDocumentoFrenteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Validar que sea una imagen
    if (!archivo.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido para el documento de identidad');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (archivo.size > 5 * 1024 * 1024) {
      toast.error('El documento de identidad no debe superar los 5MB');
      return;
    }

    setArchivoDocumentoFrente(archivo);

    // Crear previsualización
    const reader = new FileReader();
    reader.onloadend = () => {
      setPrevisualizacionDocFrente(reader.result as string);
    };
    reader.readAsDataURL(archivo);
  };

  // ✅ NUEVO: Manejar selección de archivo de documento de identidad (reverso)
  const handleArchivoDocumentoReversoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Validar que sea una imagen
    if (!archivo.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido para el documento de identidad');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (archivo.size > 5 * 1024 * 1024) {
      toast.error('El documento de identidad no debe superar los 5MB');
      return;
    }

    setArchivoDocumentoReverso(archivo);

    // Crear previsualización
    const reader = new FileReader();
    reader.onloadend = () => {
      setPrevisualizacionDocReverso(reader.result as string);
    };
    reader.readAsDataURL(archivo);
  };

  // Convertir archivo a base64
  const convertirArchivoABase64 = (archivo: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(archivo);
    });
  };

  // Manejar submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!nombre || !email || !password || !edad) {
      toast.error('Por favor completa todos los campos requeridos (nombre, email, contraseña, edad)');
      return;
    }

    if (password !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // ✅ NUEVO FLUJO: Crear usuario directamente con Supabase (sin servidor)
      
      // Paso 0: Verificar que el email no esté registrado
      console.log(`🔍 Verificando si ${email} ya existe...`);
      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios')
        .select('email, role')
        .eq('email', email)
        .single();

      if (existingUser && !checkError) {
        toast.error(`El email ${email} ya está registrado como ${existingUser.role}`);
        setLoading(false);
        return;
      }

      // Paso 1: Subir fotos PRIMERO (antes de crear el usuario)
      let fotoPerfilUrl: string | null = null;
      let fotosAdicionalesUrls: string[] = [];
      let documentoFrenteUrl: string | null = null;
      let documentoReversoUrl: string | null = null;

      console.log('📸 Fotos a procesar:');
      console.log('  - ¿Tiene foto de perfil?:', !!archivoFoto);
      console.log('  - Cantidad fotos adicionales:', archivosFotosAdicionales.length);
      console.log('  - ¿Tiene documento frente?:', !!archivoDocumentoFrente);
      console.log('  - ¿Tiene documento reverso?:', !!archivoDocumentoReverso);

      // Crear bucket si no existe
      const bucketName = 'make-9dadc017-modelos-fotos';
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log('🪣 Creando bucket de fotos...');
        const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 5242880 // 5MB
        });
        if (bucketError) {
          console.error('❌ Error creando bucket:', bucketError);
        } else {
          console.log('✅ Bucket creado exitosamente');
        }
      }

      // Subir foto de perfil
      if (archivoFoto) {
        console.log('📸 Subiendo foto de perfil...');
        try {
          const fileName = `${email.split('@')[0]}/perfil-${Date.now()}.${archivoFoto.name.split('.').pop()}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, archivoFoto, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          // Obtener URL firmada
          const { data: urlData } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(fileName, 365 * 24 * 60 * 60); // 1 año

          fotoPerfilUrl = urlData?.signedUrl || null;
          console.log('✅ Foto de perfil subida:', fotoPerfilUrl);
        } catch (error) {
          console.error('❌ Error subiendo foto de perfil:', error);
          toast.warning('No se pudo subir la foto de perfil, se creará sin imagen');
        }
      }

      // Subir fotos adicionales
      if (archivosFotosAdicionales.length > 0) {
        console.log(`📸 Subiendo ${archivosFotosAdicionales.length} fotos adicionales...`);
        for (let i = 0; i < archivosFotosAdicionales.length; i++) {
          const archivo = archivosFotosAdicionales[i];
          try {
            const fileName = `${email.split('@')[0]}/adicional-${i + 1}-${Date.now()}.${archivo.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(bucketName)
              .upload(fileName, archivo, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) throw uploadError;

            const { data: urlData } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(fileName, 365 * 24 * 60 * 60);

            if (urlData?.signedUrl) {
              fotosAdicionalesUrls.push(urlData.signedUrl);
              console.log(`✅ Foto adicional ${i + 1} subida`);
            }
          } catch (error) {
            console.error(`❌ Error subiendo foto adicional ${i + 1}:`, error);
          }
        }
      }

      // Subir documento de identidad (frente)
      if (archivoDocumentoFrente) {
        console.log('📸 Subiendo documento de identidad (frente)...');
        try {
          const fileName = `${email.split('@')[0]}/doc-frente-${Date.now()}.${archivoDocumentoFrente.name.split('.').pop()}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, archivoDocumentoFrente, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(fileName, 365 * 24 * 60 * 60);

          documentoFrenteUrl = urlData?.signedUrl || null;
          console.log('✅ Documento frente subido:', documentoFrenteUrl);
        } catch (error) {
          console.error('❌ Error subiendo documento frente:', error);
          toast.warning('No se pudo subir el documento de identidad (frente)');
        }
      }

      // Subir documento de identidad (reverso)
      if (archivoDocumentoReverso) {
        console.log('📸 Subiendo documento de identidad (reverso)...');
        try {
          const fileName = `${email.split('@')[0]}/doc-reverso-${Date.now()}.${archivoDocumentoReverso.name.split('.').pop()}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, archivoDocumentoReverso, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(fileName, 365 * 24 * 60 * 60);

          documentoReversoUrl = urlData?.signedUrl || null;
          console.log('✅ Documento reverso subido:', documentoReversoUrl);
        } catch (error) {
          console.error('❌ Error subiendo documento reverso:', error);
          toast.warning('No se pudo subir el documento de identidad (reverso)');
        }
      }

      // Paso 2: Crear usuario en Auth con signUp
      console.log(`🔐 Creando usuario en Supabase Auth: ${email}`);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            nombre: nombre,
            role: 'modelo'
          },
          emailRedirectTo: undefined // No enviar email de confirmación
        }
      });

      if (authError) {
        console.error('❌ Error creando usuario en Auth:', authError);
        toast.error(`Error al crear usuario: ${authError.message}`);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        console.error('❌ No se obtuvo el usuario de Auth');
        toast.error('Error al crear usuario en el sistema');
        setLoading(false);
        return;
      }

      const userId = authData.user.id;
      console.log('✅ Usuario creado en Auth con ID:', userId);

      // Paso 3: Insertar datos completos en tabla usuarios
      // El trigger handle_new_user() ya insertó el registro básico,
      // ahora lo actualizamos con TODOS los datos
      console.log('💾 Guardando datos completos de la modelo...');

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          nombre: nombre,
          nombreArtistico: nombreArtistico || nombre,
          telefono: telefono || null,
          cedula: cedula || null,
          edad: parseInt(edad),
          direccion: direccion || null,
          fotoPerfil: fotoPerfilUrl,
          fotosAdicionales: fotosAdicionalesUrls,
          descripcion: descripcion || null,
          altura: altura || null,
          medidas: medidas || null,
          sede: sede || null,
          estado: 'activo',
          disponible: disponible,
          domicilio: domicilio,
          politica_tarifa: politicaTarifa,
          documento_frente: documentoFrenteUrl,
          documento_reverso: documentoReversoUrl
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error actualizando datos de modelo:', updateError);
        toast.error(`Error guardando datos: ${updateError.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ Modelo creada exitosamente');

      // Paso 4: Recargar lista de modelos
      console.log('🔄 Recargando lista de modelos...');
      await recargarModelos();
      console.log('✅ Lista de modelos recargada');

      // Mostrar credenciales
      toast.success(`✅ Modelo ${nombre} creada exitosamente`);
      setCredencialesCreadas({
        nombre: nombre,
        email: email,
        password: password
      });
      setMostrarCredenciales(true);

      // Resetear formulario
      resetForm();
      
    } catch (error: any) {
      console.error('❌ Error inesperado:', error);
      toast.error(error.message || 'Error al crear la modelo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <UserPlus className="w-6 h-6 text-primary" />
              Crear Nueva Modelo
            </DialogTitle>
            <DialogDescription>
              Completa la información para crear el perfil y las credenciales de acceso
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección: Información Personal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Información Personal</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">
                    Nombre Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: María González"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombreArtistico">Nombre Artístico</Label>
                  <Input
                    id="nombreArtistico"
                    value={nombreArtistico}
                    onChange={(e) => setNombreArtistico(e.target.value)}
                    placeholder="Ej: Luna"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edad">
                    Edad <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edad"
                    type="number"
                    min="18"
                    value={edad}
                    onChange={(e) => setEdad(e.target.value)}
                    placeholder="Ej: 25"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula</Label>
                  <Input
                    id="cedula"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="Ej: 1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Contacto */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Contacto</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="modelo@ejemplo.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Este será su usuario para iniciar sesión
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: +57 300 1234567"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Credenciales de Acceso */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Credenciales de Acceso</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Contraseña <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarPassword">
                    Confirmar Contraseña <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmarPassword"
                    type="password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Repetir contraseña"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Sección: Perfil */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Perfil</h3>
              
              {/* Subir Foto de Perfil */}
              <div className="space-y-2">
                <Label htmlFor="archivoFoto">Foto de Perfil</Label>
                
                {previsualizacionFoto ? (
                  <div className="relative">
                    <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-primary/20">
                      <img 
                        src={previsualizacionFoto} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-0 right-0 rounded-full w-8 h-8 p-0"
                      onClick={() => {
                        setArchivoFoto(null);
                        setPrevisualizacionFoto('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      {archivoFoto?.name}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                    <label htmlFor="archivoFoto" className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Click para subir foto</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG o WEBP (máx. 5MB)</p>
                      </div>
                    </label>
                    <Input
                      id="archivoFoto"
                      type="file"
                      accept="image/*"
                      onChange={handleArchivoFotoChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Subir Fotos Adicionales */}
              <div className="space-y-2">
                <Label htmlFor="archivosFotosAdicionales">Fotos Adicionales (Galería)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Puedes agregar múltiples fotos que se mostrarán en la galería de la modelo
                </p>
                
                <Input
                  id="archivosFotosAdicionales"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleArchivosFotosAdicionalesChange}
                  className="cursor-pointer"
                />

                {/* Mostrar fotos adicionales seleccionadas */}
                {archivosFotosAdicionales.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {archivosFotosAdicionales.map((archivo, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-border">
                          <img 
                            src={previsualizacionesFotosAdicionales[index] || URL.createObjectURL(archivo)} 
                            alt={`Foto adicional ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 rounded-full w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setArchivosFotosAdicionales(prev => prev.filter((_, i) => i !== index));
                            setPrevisualizacionesFotosAdicionales(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-1 truncate">
                          {archivo.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción / Especialidades</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción breve, especialidades o notas..."
                  rows={3}
                />
              </div>
            </div>

            {/* ✅ NUEVA SECCIÓN: Documentos de Identidad */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Documentos de Identidad
              </h3>
              <p className="text-sm text-muted-foreground">
                Sube fotos del documento de identidad de la modelo (cédula, pasaporte, etc.)
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Documento Frente */}
                <div className="space-y-2">
                  <Label htmlFor="archivoDocumentoFrente">Documento Frente</Label>
                  
                  {previsualizacionDocFrente ? (
                    <div className="relative">
                      <div className="aspect-[16/10] rounded-lg overflow-hidden border-2 border-primary/20">
                        <img 
                          src={previsualizacionDocFrente} 
                          alt="Documento Frente" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
                        onClick={() => {
                          setArchivoDocumentoFrente(null);
                          setPrevisualizacionDocFrente('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2 truncate">
                        {archivoDocumentoFrente?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <label htmlFor="archivoDocumentoFrente" className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium">Subir frente</p>
                          <p className="text-xs text-muted-foreground">PNG o JPG (máx. 5MB)</p>
                        </div>
                      </label>
                      <Input
                        id="archivoDocumentoFrente"
                        type="file"
                        accept="image/*"
                        onChange={handleArchivoDocumentoFrenteChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Documento Reverso */}
                <div className="space-y-2">
                  <Label htmlFor="archivoDocumentoReverso">Documento Reverso</Label>
                  
                  {previsualizacionDocReverso ? (
                    <div className="relative">
                      <div className="aspect-[16/10] rounded-lg overflow-hidden border-2 border-primary/20">
                        <img 
                          src={previsualizacionDocReverso} 
                          alt="Documento Reverso" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
                        onClick={() => {
                          setArchivoDocumentoReverso(null);
                          setPrevisualizacionDocReverso('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2 truncate">
                        {archivoDocumentoReverso?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <label htmlFor="archivoDocumentoReverso" className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium">Subir reverso</p>
                          <p className="text-xs text-muted-foreground">PNG o JPG (máx. 5MB)</p>
                        </div>
                      </label>
                      <Input
                        id="archivoDocumentoReverso"
                        type="file"
                        accept="image/*"
                        onChange={handleArchivoDocumentoReversoChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Estado y Configuración */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Estado y Configuración</h3>

              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <Label htmlFor="activa" className="cursor-pointer">
                    Estado Activa
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    ¿La modelo está activa y disponible para servicios?
                  </p>
                </div>
                <Switch
                  id="activa"
                  checked={activa}
                  onCheckedChange={setActiva}
                />
              </div>
            </div>

            {/* Sección: Datos Físicos y Ubicación */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Datos Físicos y Ubicación</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="altura">Altura</Label>
                  <Input
                    id="altura"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    placeholder="Ej: 165 cm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medidas">Medidas</Label>
                  <Input
                    id="medidas"
                    value={medidas}
                    onChange={(e) => setMedidas(e.target.value)}
                    placeholder="Ej: 90-60-90"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sede">Sede de Trabajo</Label>
                  <Input
                    id="sede"
                    value={sede}
                    onChange={(e) => setSede(e.target.value)}
                    placeholder="Ej: Sede Zona Norte"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej: Calle 123 #45-67"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <Label htmlFor="disponible" className="cursor-pointer">
                    Disponible Ahora
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    ¿La modelo está disponible para atender clientes ahora?
                  </p>
                </div>
                <Switch
                  id="disponible"
                  checked={disponible}
                  onCheckedChange={setDisponible}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <Label htmlFor="domicilio" className="cursor-pointer">
                    Presta Servicio a Domicilio
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    ¿La modelo hace domicilios o solo trabaja en sede?
                  </p>
                </div>
                <Switch
                  id="domicilio"
                  checked={domicilio}
                  onCheckedChange={setDomicilio}
                />
              </div>

              {/* SELECTOR DE POLÍTICA TARIFARIA */}
              <div className="space-y-3 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
                <Label className="text-base font-semibold">💰 Política Tarifaria</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Selecciona la política de tarifas que se aplicará automáticamente a esta modelo
                </p>
                
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPoliticaTarifa(1)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      politicaTarifa === 1
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💚</div>
                      <div className="font-semibold text-sm">Económica</div>
                      <div className="text-xs text-muted-foreground mt-1">Tarifas básicas</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPoliticaTarifa(2)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      politicaTarifa === 2
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">⭐</div>
                      <div className="font-semibold text-sm">Estándar</div>
                      <div className="text-xs text-muted-foreground mt-1">Tarifas regulares</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPoliticaTarifa(3)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      politicaTarifa === 3
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💎</div>
                      <div className="font-semibold text-sm">Premium</div>
                      <div className="text-xs text-muted-foreground mt-1">Tarifas VIP</div>
                    </div>
                  </button>
                </div>

                <div className="mt-3 p-2 bg-blue-950/20 border border-blue-500/30 rounded text-xs text-blue-300">
                  <strong>💡 Nota:</strong> Las tarifas se aplicarán automáticamente al crear la modelo.
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Crear Modelo
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal de Credenciales */}
      <CredencialesModal
        open={mostrarCredenciales}
        onClose={() => setMostrarCredenciales(false)}
        nombre={credencialesCreadas.nombre}
        email={credencialesCreadas.email}
        password={credencialesCreadas.password}
        role="modelo"
      />
    </>
  );
}