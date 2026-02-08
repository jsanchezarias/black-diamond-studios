/**
 * 📸 Panel para subir fotos de modelos a Supabase Storage
 * Reemplaza las URLs problemáticas de Google Drive con URLs de Supabase
 */

import { useState } from 'react';
import { supabase } from '../src/utils/supabase/info'; // ✅ Corregido: ruta correcta
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import { Upload, Image, CheckCircle2, AlertCircle } from 'lucide-react';

interface ModeloFotos {
  email: string;
  nombre: string;
  fotoPerfil?: File;
  fotosAdicionales: File[];
}

export function SubirFotosModelosPanel() {
  const [uploading, setUploading] = useState(false);
  const [modelosData, setModelosData] = useState<Record<string, ModeloFotos>>({
    'isabella@blackdiamond.com': {
      email: 'isabella@blackdiamond.com',
      nombre: 'Isabella',
      fotosAdicionales: []
    },
    'natalia@blackdiamond.com': {
      email: 'natalia@blackdiamond.com',
      nombre: 'Natalia',
      fotosAdicionales: []
    },
    'ximena@blackdiamond.com': {
      email: 'ximena@blackdiamond.com',
      nombre: 'Ximena',
      fotosAdicionales: []
    }
  });

  const handleFotoPerfilChange = (email: string, file: File) => {
    setModelosData(prev => ({
      ...prev,
      [email]: {
        ...prev[email],
        fotoPerfil: file
      }
    }));
  };

  const handleFotosAdicionalesChange = (email: string, files: FileList) => {
    const filesArray = Array.from(files);
    setModelosData(prev => ({
      ...prev,
      [email]: {
        ...prev[email],
        fotosAdicionales: [...prev[email].fotosAdicionales, ...filesArray]
      }
    }));
  };

  const removeFotoAdicional = (email: string, index: number) => {
    setModelosData(prev => ({
      ...prev,
      [email]: {
        ...prev[email],
        fotosAdicionales: prev[email].fotosAdicionales.filter((_, i) => i !== index)
      }
    }));
  };

  const subirFotos = async () => {
    setUploading(true);
    console.log('📸 Iniciando subida de fotos a Supabase Storage...\n');

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-9dadc017`;

      // 1. Crear bucket si no existe (usando el servidor con service role)
      console.log('📦 Asegurando que el bucket existe...');
      const bucketResponse = await fetch(`${serverUrl}/upload/ensure-bucket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!bucketResponse.ok) {
        const error = await bucketResponse.json();
        console.error('❌ Error creando bucket:', error);
        toast.error('Error preparando almacenamiento');
        return;
      }

      console.log('✅ Bucket listo');

      // 2. Subir fotos de cada modelo
      for (const [email, data] of Object.entries(modelosData)) {
        console.log(`\n📤 Procesando ${data.nombre}...`);

        let fotoPerfilUrl: string | null = null;
        const fotosAdicionalesUrls: string[] = [];

        // Subir foto de perfil
        if (data.fotoPerfil) {
          console.log(`   📸 Subiendo foto de perfil...`);

          // Convertir File a base64
          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve) => {
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(data.fotoPerfil!);
          });

          const fileName = `${email.split('@')[0]}/perfil-${Date.now()}.${data.fotoPerfil.name.split('.').pop()}`;

          const uploadResponse = await fetch(`${serverUrl}/upload/foto`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify({
              fileName,
              fileData: base64Data,
              contentType: data.fotoPerfil.type
            })
          });

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            console.error(`   ❌ Error subiendo foto de perfil:`, error);
            toast.error(`Error subiendo foto de perfil de ${data.nombre}`);
            continue;
          }

          const { url } = await uploadResponse.json();
          fotoPerfilUrl = url;
          console.log(`   ✅ Foto de perfil subida`);
        }

        // Subir fotos adicionales
        for (let i = 0; i < data.fotosAdicionales.length; i++) {
          const foto = data.fotosAdicionales[i];
          console.log(`   📸 Subiendo foto adicional ${i + 1}/${data.fotosAdicionales.length}`);

          // Convertir File a base64
          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve) => {
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(foto);
          });

          const fileName = `${email.split('@')[0]}/adicional-${i + 1}-${Date.now()}.${foto.name.split('.').pop()}`;

          const uploadResponse = await fetch(`${serverUrl}/upload/foto`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify({
              fileName,
              fileData: base64Data,
              contentType: foto.type
            })
          });

          if (!uploadResponse.ok) {
            console.error(`   ❌ Error subiendo foto adicional ${i + 1}`);
            continue;
          }

          const { url } = await uploadResponse.json();
          fotosAdicionalesUrls.push(url);
          console.log(`   ✅ Foto adicional ${i + 1} subida`);
        }

        // 3. Actualizar registro en la base de datos
        if (fotoPerfilUrl || fotosAdicionalesUrls.length > 0) {
          console.log(`\n💾 Actualizando registro en BD para ${data.nombre}...`);

          const updateResponse = await fetch(`${serverUrl}/upload/update-modelo`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify({
              email,
              fotoPerfil: fotoPerfilUrl,
              fotosAdicionales: fotosAdicionalesUrls.length > 0 ? fotosAdicionalesUrls : undefined
            })
          });

          if (!updateResponse.ok) {
            const error = await updateResponse.json();
            console.error(`   ❌ Error actualizando BD:`, error);
            toast.error(`Error guardando URLs de ${data.nombre}`);
          } else {
            console.log(`   ✅ ${data.nombre} actualizada en BD`);
            toast.success(`✅ ${data.nombre} actualizada correctamente`);
          }
        }
      }

      console.log('\n🎉 Proceso de subida completado!');
      toast.success('¡Todas las fotos se subieron correctamente!');

      // Recargar la página para ver los cambios
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('❌ Error inesperado:', error);
      toast.error('Error inesperado al subir fotos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-blue-500/50 bg-blue-500/10">
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-blue-400 mb-2 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            📸 Subir Fotos de Modelos a Supabase Storage
          </h3>
          <p className="text-sm text-muted-foreground">
            Sube las fotos reales de Isabella, Natalia y Ximena para reemplazar las URLs de Google Drive
          </p>
        </div>

        <div className="space-y-6">
          {Object.entries(modelosData).map(([email, data]) => (
            <div key={email} className="border border-border/50 rounded-lg p-4 bg-card/30">
              <h4 className="font-semibold text-white mb-4">👤 {data.nombre}</h4>

              {/* Foto de Perfil */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  📸 Foto de Perfil (Principal)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFotoPerfilChange(email, e.target.files[0]);
                      }
                    }}
                    className="block w-full text-sm text-gray-300
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-white
                      hover:file:bg-primary/90
                      file:cursor-pointer cursor-pointer"
                    disabled={uploading}
                  />
                  {data.fotoPerfil && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
                {data.fotoPerfil && (
                  <p className="text-xs text-green-400 mt-1">
                    ✓ {data.fotoPerfil.name}
                  </p>
                )}
              </div>

              {/* Fotos Adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  🖼️ Fotos Adicionales (Galería)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFotosAdicionalesChange(email, e.target.files);
                    }
                  }}
                  className="block w-full text-sm text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-secondary file:text-white
                    hover:file:bg-secondary/80
                    file:cursor-pointer cursor-pointer"
                  disabled={uploading}
                />

                {/* Lista de fotos adicionales */}
                {data.fotosAdicionales.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {data.fotosAdicionales.map((foto, index) => (
                      <div key={index} className="flex items-center justify-between text-xs text-gray-400 bg-secondary/30 px-3 py-2 rounded">
                        <span className="flex items-center gap-2">
                          <Image className="w-3 h-3" />
                          {foto.name}
                        </span>
                        <button
                          onClick={() => removeFotoAdicional(email, index)}
                          className="text-red-400 hover:text-red-300"
                          disabled={uploading}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instrucciones */}
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200/90">
              <p className="font-semibold mb-2">💡 Instrucciones:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Selecciona la foto de perfil principal de cada modelo</li>
                <li>Opcionalmente, agrega fotos adicionales para la galería</li>
                <li>Haz clic en "Subir Todas las Fotos" cuando estés listo</li>
                <li>Las fotos se subirán a Supabase Storage (sin problemas de CORS)</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Botón de acción */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={subirFotos}
            disabled={uploading || Object.values(modelosData).every(d => !d.fotoPerfil && d.fotosAdicionales.length === 0)}
            className="bg-primary hover:bg-primary/90"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Subiendo fotos...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Subir Todas las Fotos
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}