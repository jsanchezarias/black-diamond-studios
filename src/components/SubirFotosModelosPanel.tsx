/**
 * 📸 Panel para subir fotos de modelos a Supabase Storage
 * Reemplaza las URLs problemáticas de Google Drive con URLs de Supabase
 */

import { useState } from 'react';
import { supabase } from '../utils/supabase/info'; // ✅ Corregido: ruta correcta
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
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

    try {
      const { supabase } = await import('../utils/supabase/info');

      const uploadFile = async (file: File, path: string): Promise<string | null> => {
        const { error } = await supabase.storage.from('modelos-fotos').upload(path, file, { upsert: true });
        if (error) { if (process.env.NODE_ENV === 'development') console.error('❌ Upload error:', error.message); return null; }
        const { data } = supabase.storage.from('modelos-fotos').getPublicUrl(path);
        return data?.publicUrl || null;
      };

      // Subir fotos de cada modelo
      for (const [email, data] of Object.entries(modelosData)) {

        let fotoPerfilUrl: string | null = null;
        const fotosAdicionalesUrls: string[] = [];

        if (data.fotoPerfil) {
          const path = `${email.split('@')[0]}/perfil-${Date.now()}.${data.fotoPerfil.name.split('.').pop()}`;
          fotoPerfilUrl = await uploadFile(data.fotoPerfil, path);
          if (!fotoPerfilUrl) { toast.error(`Error subiendo foto de perfil de ${data.nombre}`); continue; }
        }

        for (let i = 0; i < data.fotosAdicionales.length; i++) {
          const foto = data.fotosAdicionales[i];
          const path = `${email.split('@')[0]}/adicional-${i + 1}-${Date.now()}.${foto.name.split('.').pop()}`;
          const url = await uploadFile(foto, path);
          if (url) { fotosAdicionalesUrls.push(url); }
        }

        if (fotoPerfilUrl || fotosAdicionalesUrls.length > 0) {
          const updateData: any = {};
          if (fotoPerfilUrl) updateData.fotoPerfil = fotoPerfilUrl;
          if (fotosAdicionalesUrls.length > 0) updateData.fotosAdicionales = fotosAdicionalesUrls;

          const { error: dbError } = await supabase
            .from('usuarios')
            .update(updateData)
            .eq('email', email);

          if (dbError) {
            toast.error(`Error guardando URLs de ${data.nombre}`);
          } else {
            toast.success(`✅ ${data.nombre} actualizada correctamente`);
          }
        }
      }

      toast.success('¡Todas las fotos se subieron correctamente!');

      // Recargar la página para ver los cambios
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Error inesperado:', error);
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