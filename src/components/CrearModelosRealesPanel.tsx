import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { UserPlus, Copy, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
import { supabase } from '../utils/supabase/info';

// Datos de las modelos reales — sin contraseñas hardcodeadas
const modelosReales = [
  {
    id: 'annie-001',
    nombre: 'Annie',
    nombreArtistico: 'Annie',
    edad: 21,
    cedula: '',
    telefono: '',
    email: 'annie@blackdiamondapp.com',
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
    fotoPerfil: 'https://lh3.googleusercontent.com/d/1vS4yN1pO7zM5rX8wW2lV9gE6fU3qD1C',
    altura: '148 cm',
    medidas: '92-73-96',
    descripcion: 'Rasgos delicados y mirada serena, belleza suave y armoniosa.',
    sede: 'Sede Norte',
  },
];

/**
 * Genera una contraseña segura aleatoria.
 * - Mínimo 14 caracteres
 * - Al menos 1 mayúscula, 1 minúscula, 1 dígito, 1 símbolo
 * - Diferente en cada llamada
 */
function generarPasswordSegura(): string {
  const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minusculas = 'abcdefghjkmnpqrstuvwxyz';
  const digitos = '23456789';
  const simbolos = '!@#$%&*+-?';

  const todos = mayusculas + minusculas + digitos + simbolos;

  const array = new Uint32Array(14);
  crypto.getRandomValues(array);

  // Garantizar al menos uno de cada tipo en posiciones fijas
  const chars: string[] = [
    mayusculas[array[0] % mayusculas.length],
    mayusculas[array[1] % mayusculas.length],
    minusculas[array[2] % minusculas.length],
    minusculas[array[3] % minusculas.length],
    digitos[array[4] % digitos.length],
    digitos[array[5] % digitos.length],
    simbolos[array[6] % simbolos.length],
  ];

  // Rellenar el resto hasta 14 caracteres con caracteres aleatorios del pool completo
  for (let i = 7; i < 14; i++) {
    chars.push(todos[array[i] % todos.length]);
  }

  // Mezclar con Fisher-Yates usando valores adicionales del CSPRNG
  const shuffle = new Uint32Array(chars.length);
  crypto.getRandomValues(shuffle);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = shuffle[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

/** Genera un mapa inicial con contraseñas únicas para cada modelo */
function inicializarPasswords(): Record<string, string> {
  return Object.fromEntries(modelosReales.map(m => [m.id, generarPasswordSegura()]));
}

interface CrearModelosRealesPanelProps {
  onClose: () => void;
  onModeloCreada?: () => void;
}

export function CrearModelosRealesPanel({ onClose, onModeloCreada }: CrearModelosRealesPanelProps) {
  const [cargando, setCargando] = useState(false);
  const [modelosCreadas, setModelosCreadas] = useState<string[]>([]);
  const [errores, setErrores] = useState<string[]>([]);

  // Contraseñas generadas de forma segura al montar el componente
  const [passwordsGeneradas, setPasswordsGeneradas] = useState<Record<string, string>>(inicializarPasswords);

  // Credenciales personalizadas opcionales ingresadas por el admin
  const [credencialesPersonalizadas, setCredencialesPersonalizadas] = useState<{
    [key: string]: { email: string; password: string; cedula: string; telefono: string }
  }>({});

  const handleInputChange = (modeloId: string, field: string, value: string) => {
    setCredencialesPersonalizadas(prev => ({
      ...prev,
      [modeloId]: {
        ...prev[modeloId],
        [field]: value,
      },
    }));
  };

  const regenerarPassword = (modeloId: string) => {
    const nueva = generarPasswordSegura();
    setPasswordsGeneradas(prev => ({ ...prev, [modeloId]: nueva }));
    // Limpiar contraseña personalizada para que se use la regenerada
    setCredencialesPersonalizadas(prev => ({
      ...prev,
      [modeloId]: { ...prev[modeloId], password: '' },
    }));
    toast.success('Contraseña regenerada');
  };

  /** Devuelve la contraseña efectiva: personalizada si fue escrita, generada si no */
  const getPasswordEfectiva = (modeloId: string): string => {
    const custom = credencialesPersonalizadas[modeloId]?.password;
    return custom && custom.trim() !== '' ? custom : passwordsGeneradas[modeloId];
  };

  const crearTodasLasModelos = async () => {
    setCargando(true);
    setModelosCreadas([]);
    setErrores([]);

    for (const modelo of modelosReales) {
      try {
        await crearModelo(modelo);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.error('Error creando modelo:', error);
      }
    }

    setCargando(false);
  };

  const crearModelo = async (modelo: typeof modelosReales[0]) => {
    try {
      const credenciales = credencialesPersonalizadas[modelo.id];
      const email = credenciales?.email || modelo.email;
      const password = getPasswordEfectiva(modelo.id);
      const cedula = credenciales?.cedula || '';
      const telefono = credenciales?.telefono || '';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre: modelo.nombre, role: 'modelo' } },
      });

      if (authError) throw new Error(authError.message);

      const { error: dbError } = await supabase.from('usuarios').upsert({
        id: authData.user?.id,
        email,
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
        role: 'modelo',
        activo: true,
        disponible: true,
      }, { onConflict: 'email' });

      if (dbError) throw new Error(dbError.message);

      setModelosCreadas(prev => [...prev, modelo.nombre]);
      toast.success(`✅ ${modelo.nombre} creada exitosamente`, {
        description: `Email: ${email}`,
      });

      if (onModeloCreada) onModeloCreada();

    } catch (error: any) {
      setErrores(prev => [...prev, `${modelo.nombre}: ${error.message}`]);
      toast.error(`❌ Error creando ${modelo.nombre}`, {
        description: error.message,
      });
    }
  };

  const copiarCredenciales = (modeloId: string) => {
    const modelo = modelosReales.find(m => m.id === modeloId);
    if (!modelo) return;

    const email = credencialesPersonalizadas[modeloId]?.email || modelo.email;
    const password = getPasswordEfectiva(modeloId);

    navigator.clipboard.writeText(`${modelo.nombre}\nEmail: ${email}\nContraseña: ${password}`);
    toast.success('📋 Credenciales copiadas', { description: modelo.nombre });
  };

  const copiarTodasCredenciales = () => {
    const texto = modelosReales.map(modelo => {
      const email = credencialesPersonalizadas[modelo.id]?.email || modelo.email;
      const password = getPasswordEfectiva(modelo.id);
      return `${modelo.nombre}\nEmail: ${email}\nContraseña: ${password}\n`;
    }).join('\n---\n\n');

    navigator.clipboard.writeText(texto);
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
          <div className="flex gap-3 flex-wrap">
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
            <Button onClick={copiarTodasCredenciales} variant="outline">
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
              const passwordEfectiva = getPasswordEfectiva(modelo.id);

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
                            <Label className="text-xs">
                              Contraseña{' '}
                              <span className="text-muted-foreground">(generada automáticamente)</span>
                            </Label>
                            <div className="flex gap-1">
                              <Input
                                type="text"
                                placeholder={passwordEfectiva}
                                value={credenciales?.password || ''}
                                onChange={(e) => handleInputChange(modelo.id, 'password', e.target.value)}
                                className="h-8 text-sm font-mono"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 shrink-0"
                                onClick={() => regenerarPassword(modelo.id)}
                                title="Regenerar contraseña"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            </div>
                            {/* Mostrar contraseña generada activa */}
                            {(!credenciales?.password || credenciales.password.trim() === '') && (
                              <p className="text-xs text-primary font-mono mt-1 break-all">
                                Activa: {passwordEfectiva}
                              </p>
                            )}
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
                            Copiar credenciales
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
                <li>1. Cada modelo recibe una contraseña segura única generada aleatoriamente</li>
                <li>2. Usa el botón 🔄 para regenerar una contraseña si no te convence</li>
                <li>3. Puedes escribir una contraseña propia en el campo — si lo dejas vacío se usa la generada</li>
                <li>4. Copia las credenciales ANTES de crear — no se volverán a mostrar igual</li>
                <li>5. Click en "Crear Todas" o crea una por una</li>
              </ul>
            </CardContent>
          </Card>

          {/* Advertencia de seguridad */}
          <Card className="bg-yellow-950/20 border-yellow-500/30">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-300/90 space-y-1">
                <p className="font-medium">⚠️ Guarda las contraseñas ahora</p>
                <p>Las contraseñas se generan solo durante esta sesión. Si cierras este panel sin copiarlas, deberás resetear las contraseñas desde el panel de administración de Supabase.</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
