import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { UserPlus, Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Datos de las modelos reales extraídos de sedesData.ts
const modelosReales = [
  {
    id: 'annie-001',
    nombre: 'Annie',
    nombreArtistico: 'Annie',
    edad: 21,
    cedula: '',
    telefono: '',
    email: 'annie@blackdiamondapp.com',
    passwordDefault: 'Annie2025*',
    fotoPerfil: 'https://lh3.googleusercontent.com/d/1qYdBfWfotlCxuJKD4TXTp3aHotIJ9Ep1',
    altura: '165 cm',
    medidas: '90-65-96',
    descripcion: 'Belleza colombo-venezolana con una mezcla única de elegancia y pasión.',
    sede: 'Sede Norte',
  },
  {
    id: 'luci-002',
    nombre: 'Luci',
    nombreArtistico: 'Luci',
    edad: 21,
    cedula: '',
    telefono: '',
    email: 'luci@blackdiamondapp.com',
    passwordDefault: 'Luci2025*',
    fotoPerfil: 'https://lh3.googleusercontent.com/d/1b1P4V-apOjcNgqE_MgqO_2Q2o6dTCy2B',
    altura: '150 cm',
    medidas: '85-58-87',
    descripcion: 'Joven y radiante, destaca por su estética petite y rasgos delicados.',
    sede: 'Sede Norte',
  },
  {
    id: 'isabella-003',
    nombre: 'Isabella',
    nombreArtistico: 'Isabella',
    edad: 21,
    cedula: '',
    telefono: '',
    email: 'isabella@blackdiamondapp.com',
    passwordDefault: 'Isabella2025*',
    fotoPerfil: 'https://lh3.googleusercontent.com/d/1yO0C4m5vR8pL2xK9dT3jE7fU6nW8qA2B',
    altura: '170 cm',
    medidas: '90-63-94',
    descripcion: 'Alta y de belleza delicada, combina elegancia y formación académica.',
    sede: 'Sede Norte',
  },
  {
    id: 'natalia-004',
    nombre: 'Natalia',
    nombreArtistico: 'Natalia',
    edad: 21,
    cedula: '',
    telefono: '',
    email: 'natalia@blackdiamondapp.com',
    passwordDefault: 'Natalia2025*',
    fotoPerfil: 'https://lh3.googleusercontent.com/d/1sP9uR7kL4xJ2nY5vE8tC6mW3dQ1oA7B',
    altura: '154 cm',
    medidas: '88-56-87',
    descripcion: 'De piel trigueña y rasgos cautivadores, belleza misteriosa y magnética.',
    sede: 'Sede Norte',
  },
  {
    id: 'ximena-005',
    nombre: 'Ximena',
    nombreArtistico: 'Ximena',
    edad: 21,
    cedula: '',
    telefono: '',
    email: 'ximena@blackdiamondapp.com',
    passwordDefault: 'Ximena2025*',
    fotoPerfil: 'https://lh3.googleusercontent.com/d/1vS4yN1pO7zM5rX8wW2lV9gE6fU3qD1C',
    altura: '148 cm',
    medidas: '92-73-96',
    descripcion: 'Rasgos delicados y mirada serena, belleza suave y armoniosa.',
    sede: 'Sede Norte',
  },
];

interface CrearModelosRealesPanelProps {
  onClose: () => void;
  onModeloCreada?: () => void;
}

export function CrearModelosRealesPanel({ onClose, onModeloCreada }: CrearModelosRealesPanelProps) {
  const [cargando, setCargando] = useState(false);
  const [modelosCreadas, setModelosCreadas] = useState<string[]>([]);
  const [errores, setErrores] = useState<string[]>([]);

  // Estados para personalizar credenciales
  const [credencialesPersonalizadas, setCredencialesPersonalizadas] = useState<{
    [key: string]: { email: string; password: string; cedula: string; telefono: string }
  }>({});

  const handleInputChange = (modeloId: string, field: string, value: string) => {
    setCredencialesPersonalizadas(prev => ({
      ...prev,
      [modeloId]: {
        ...prev[modeloId],
        [field]: value
      }
    }));
  };

  const crearTodasLasModelos = async () => {
    setCargando(true);
    setModelosCreadas([]);
    setErrores([]);

    for (const modelo of modelosReales) {
      try {
        await crearModelo(modelo);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay entre creaciones
      } catch (error) {
        console.error(`Error creando ${modelo.nombre}:`, error);
      }
    }

    setCargando(false);
  };

  const crearModelo = async (modelo: typeof modelosReales[0]) => {
    try {
      // Obtener credenciales (personalizadas o por defecto)
      const credenciales = credencialesPersonalizadas[modelo.id];
      const email = credenciales?.email || modelo.email;
      const password = credenciales?.password || modelo.passwordDefault;
      const cedula = credenciales?.cedula || '';
      const telefono = credenciales?.telefono || '';

      console.log(`🔄 Creando modelo: ${modelo.nombre} (${email})`);

      // Llamada al endpoint de Supabase para crear usuario
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9dadc017/modelos/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          nombre: modelo.nombre,
          nombreArtistico: modelo.nombreArtistico,
          edad: modelo.edad,
          cedula,
          telefono,
          fotoPerfil: modelo.fotoPerfil,
          altura: modelo.altura,
          medidas: modelo.medidas,
          descripcion: modelo.descripcion,
          sede: modelo.sede,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      setModelosCreadas(prev => [...prev, modelo.nombre]);
      toast.success(`✅ ${modelo.nombre} creada exitosamente`, {
        description: `Email: ${email}`
      });

      if (onModeloCreada) {
        onModeloCreada();
      }

    } catch (error: any) {
      console.error(`❌ Error creando ${modelo.nombre}:`, error);
      setErrores(prev => [...prev, `${modelo.nombre}: ${error.message}`]);
      toast.error(`❌ Error creando ${modelo.nombre}`, {
        description: error.message
      });
    }
  };

  const copiarCredenciales = (modeloId: string) => {
    const modelo = modelosReales.find(m => m.id === modeloId);
    if (!modelo) return;

    const credenciales = credencialesPersonalizadas[modeloId];
    const email = credenciales?.email || modelo.email;
    const password = credenciales?.password || modelo.passwordDefault;

    const texto = `${modelo.nombre}\nEmail: ${email}\nContraseña: ${password}`;
    navigator.clipboard.writeText(texto);
    
    toast.success('📋 Credenciales copiadas', {
      description: `${modelo.nombre}`
    });
  };

  const copiarTodasCredenciales = () => {
    const textoCompleto = modelosReales.map(modelo => {
      const credenciales = credencialesPersonalizadas[modelo.id];
      const email = credenciales?.email || modelo.email;
      const password = credenciales?.password || modelo.passwordDefault;
      return `${modelo.nombre}\nEmail: ${email}\nContraseña: ${password}\n`;
    }).join('\n---\n\n');

    navigator.clipboard.writeText(textoCompleto);
    toast.success('📋 Todas las credenciales copiadas');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">🎭 Crear Perfiles de Modelos Reales</CardTitle>
              <CardDescription>
                Configura y crea usuarios para las {modelosReales.length} modelos de la página web
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Botones de acción masiva */}
          <div className="flex gap-3">
            <Button
              onClick={crearTodasLasModelos}
              disabled={cargando}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {cargando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear Todas las Modelos ({modelosReales.length})
                </>
              )}
            </Button>
            <Button
              onClick={copiarTodasCredenciales}
              variant="outline"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Todas las Credenciales
            </Button>
          </div>

          {/* Estadísticas */}
          {(modelosCreadas.length > 0 || errores.length > 0) && (
            <div className="flex gap-3">
              {modelosCreadas.length > 0 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {modelosCreadas.length} creadas
                </Badge>
              )}
              {errores.length > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errores.length} errores
                </Badge>
              )}
            </div>
          )}

          {/* Lista de modelos */}
          <div className="space-y-4">
            {modelosReales.map((modelo) => {
              const credenciales = credencialesPersonalizadas[modelo.id];
              const isCreated = modelosCreadas.includes(modelo.nombre);
              const hasError = errores.some(e => e.startsWith(modelo.nombre));

              return (
                <Card key={modelo.id} className={`border ${
                  isCreated ? 'border-green-500/50 bg-green-500/5' :
                  hasError ? 'border-red-500/50 bg-red-500/5' :
                  'border-border'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Foto */}
                      <img
                        src={modelo.fotoPerfil}
                        alt={modelo.nombre}
                        className="w-20 h-20 rounded-lg object-cover"
                      />

                      {/* Info y formulario */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-lg">{modelo.nombre}</h3>
                            <p className="text-sm text-muted-foreground">
                              {modelo.edad} años • {modelo.altura} • {modelo.medidas}
                            </p>
                          </div>
                          {isCreated && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Creada
                            </Badge>
                          )}
                        </div>

                        {/* Formulario de credenciales */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Email</Label>
                            <Input
                              type="email"
                              placeholder={modelo.email}
                              value={credenciales?.email || ''}
                              onChange={(e) => handleInputChange(modelo.id, 'email', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Contraseña</Label>
                            <Input
                              type="text"
                              placeholder={modelo.passwordDefault}
                              value={credenciales?.password || ''}
                              onChange={(e) => handleInputChange(modelo.id, 'password', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Cédula (opcional)</Label>
                            <Input
                              type="text"
                              placeholder="Número de cédula"
                              value={credenciales?.cedula || ''}
                              onChange={(e) => handleInputChange(modelo.id, 'cedula', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Teléfono (opcional)</Label>
                            <Input
                              type="tel"
                              placeholder="+57 300 123 4567"
                              value={credenciales?.telefono || ''}
                              onChange={(e) => handleInputChange(modelo.id, 'telefono', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => crearModelo(modelo)}
                            disabled={cargando || isCreated}
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            {isCreated ? 'Creada' : 'Crear'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copiarCredenciales(modelo.id)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Instrucciones */}
          <Card className="bg-blue-950/20 border-blue-500/30">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-400 mb-2">📋 Instrucciones:</h4>
              <ul className="text-sm text-blue-300/90 space-y-1">
                <li>1. Puedes personalizar email, contraseña, cédula y teléfono para cada modelo</li>
                <li>2. Si dejas los campos vacíos, se usarán los valores por defecto</li>
                <li>3. Click en "Crear Todas" o crea una por una</li>
                <li>4. Las fotos y datos se sincronizan automáticamente con la página web</li>
                <li>5. Copia las credenciales para enviarlas a las modelos</li>
              </ul>
            </CardContent>
          </Card>

          {/* Credenciales por defecto */}
          <Card className="bg-yellow-950/20 border-yellow-500/30">
            <CardContent className="p-4">
              <h4 className="font-medium text-yellow-400 mb-3">🔑 Credenciales por Defecto:</h4>
              <div className="space-y-2 text-sm">
                {modelosReales.map(modelo => (
                  <div key={modelo.id} className="flex justify-between items-center py-1 border-b border-yellow-500/20 last:border-0">
                    <span className="text-yellow-300">{modelo.nombre}</span>
                    <code className="text-xs bg-yellow-500/20 px-2 py-1 rounded">
                      {modelo.email} / {modelo.passwordDefault}
                    </code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}