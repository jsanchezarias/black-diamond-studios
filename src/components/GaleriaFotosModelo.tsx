import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase/info';
import { toast } from 'sonner';
import { Star, Trash2, Upload, Loader2, ImageOff } from 'lucide-react';

interface FotoModelo {
  id: string;
  modelo_id: string;
  modelo_email: string;
  url: string;
  orden: number;
  es_principal: boolean;
  created_at: string;
}

interface GaleriaFotosModeloProps {
  /** UUID real de la tabla usuarios. Si no se conoce, dejar vacío y se resolverá por email. */
  modeloId?: string;
  modeloEmail: string;
  soloLectura?: boolean;
}

export function GaleriaFotosModelo({ modeloId: modeloIdProp, modeloEmail, soloLectura = false }: GaleriaFotosModeloProps) {
  const [fotos, setFotos] = useState<FotoModelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [errores, setErrores] = useState<string[]>([]);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolver UUID real desde email si modeloIdProp no es un UUID válido
  useEffect(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (modeloIdProp && uuidRegex.test(modeloIdProp)) {
      setResolvedId(modeloIdProp);
    } else if (modeloEmail) {
      supabase
        .from('usuarios')
        .select('id')
        .eq('email', modeloEmail)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.id) {
            setResolvedId(data.id);
          } else {
            setResolvedId(null);
            setLoading(false); // evitar loading infinito si el email no existe en usuarios
          }
        });
    } else {
      setLoading(false);
    }
  }, [modeloIdProp, modeloEmail]);

  const modeloId = resolvedId;

  const cargarFotos = async () => {
    if (!modeloId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('modelo_fotos')
        .select('*')
        .eq('modelo_id', modeloId)
        .order('orden', { ascending: true });

      if (error) throw error;
      setFotos(data || []);
    } catch (err) {
      toast.error('Error al cargar las fotos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modeloId) cargarFotos();
    else setLoading(resolvedId === null && !modeloEmail ? false : true);
  }, [modeloId]);

  const handleSubirFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files || []);
    if (!archivos.length) return;

    const erroresFiltro: string[] = [];
    const validos = archivos.filter(f => {
      // Validar tipo
      if (!f.type.startsWith('image/')) {
        erroresFiltro.push(`"${f.name}" no es una imagen`);
        return false;
      }
      // Validar tamaño (10MB)
      if (f.size > 10 * 1024 * 1024) {
        erroresFiltro.push(`"${f.name}" supera 10MB`);
        return false;
      }
      return true;
    });

    if (erroresFiltro.length) {
      setErrores(erroresFiltro);
      toast.error('Algunos archivos fueron omitidos', { 
        description: `${erroresFiltro.length} archivos no cumplen con los requisitos.` 
      });
    } else {
      setErrores([]);
    }

    if (!validos.length) return;

    setSubiendo(true);
    setProgreso(0);

    let subidos = 0;
    for (const archivo of validos) {
      try {
        const ext = archivo.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${modeloId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('fotos-modelos')
          .upload(fileName, archivo, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('fotos-modelos')
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        const esPrimera = fotos.length === 0 && subidos === 0;

        const { error: insertError } = await supabase
          .from('modelo_fotos')
          .insert({
            modelo_id: modeloId,
            modelo_email: modeloEmail,
            url: publicUrl,
            orden: fotos.length + subidos,
            es_principal: esPrimera,
          });

        if (insertError) throw insertError;

        // Si es la primera foto, sincronizar como foto principal en usuarios
        if (esPrimera && modeloId) {
          await supabase
            .from('usuarios')
            .update({ fotoPerfil: publicUrl })
            .eq('id', modeloId);
        }

        subidos++;
        setProgreso(Math.round((subidos / validos.length) * 100));
      } catch (err) {
        toast.error(`Error al subir "${archivo.name}"`);
      }
    }

    if (subidos > 0) {
      toast.success(`${subidos} foto${subidos > 1 ? 's' : ''} subida${subidos > 1 ? 's' : ''} correctamente`);
      await cargarFotos();
    }

    setSubiendo(false);
    setProgreso(0);
    // Limpiar input para permitir reselección del mismo archivo
    if (inputRef.current) inputRef.current.value = '';
  };

  const marcarPrincipal = async (fotoId: string) => {
    try {
      // Desmarcar todas
      const { error: resetError } = await supabase
        .from('modelo_fotos')
        .update({ es_principal: false })
        .eq('modelo_id', modeloId);

      if (resetError) throw resetError;

      // Marcar la seleccionada
      const { error: setError } = await supabase
        .from('modelo_fotos')
        .update({ es_principal: true })
        .eq('id', fotoId);

      if (setError) throw setError;

      // Sincronizar con usuarios.fotoPerfil para que aparezca en la landing
      const foto = fotos.find(f => f.id === fotoId);
      if (foto && modeloId) {
        await supabase
          .from('usuarios')
          .update({ fotoPerfil: foto.url })
          .eq('id', modeloId);
      }

      toast.success('Foto principal actualizada');
      await cargarFotos();
    } catch {
      toast.error('Error al actualizar la foto principal');
    }
  };

  const eliminarFoto = async (foto: FotoModelo) => {
    try {
      // Extraer ruta relativa del bucket desde la URL pública
      const bucketPrefix = '/storage/v1/object/public/fotos-modelos/';
      const urlPath = foto.url.includes(bucketPrefix)
        ? foto.url.split(bucketPrefix)[1]
        : null;

      if (urlPath) {
        const { error: storageError } = await supabase.storage
          .from('fotos-modelos')
          .remove([urlPath]);

        if (storageError) {
          // No bloquear si falla el storage — igual eliminar el registro
          console.warn('Advertencia al borrar del storage:', storageError.message);
        }
      }

      const { error: dbError } = await supabase
        .from('modelo_fotos')
        .delete()
        .eq('id', foto.id);

      if (dbError) throw dbError;

      // Si era la principal, marcar la primera que quede
      if (foto.es_principal) {
        const restantes = fotos.filter(f => f.id !== foto.id);
        if (restantes.length > 0) {
          await supabase
            .from('modelo_fotos')
            .update({ es_principal: true })
            .eq('id', restantes[0].id);
        }
      }

      toast.success('Foto eliminada');
      await cargarFotos();
    } catch {
      toast.error('Error al eliminar la foto');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <span className="ml-3 text-white/60 text-sm">Cargando galería...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            Galería de Fotos
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            {fotos.length} foto{fotos.length !== 1 ? 's' : ''} · máx. 10MB por imagen
          </p>
        </div>

        {!soloLectura && (
          <label className="cursor-pointer">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleSubirFotos}
              disabled={subiendo}
            />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all
              ${subiendo
                ? 'border-white/10 text-white/30 cursor-not-allowed'
                : 'border-amber-400/40 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/60'
              }`}
            >
              {subiendo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subiendo {progreso}%</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Subir fotos</span>
                </>
              )}
            </div>
          </label>
        )}
      </div>

      {/* Barra de progreso */}
      {subiendo && (
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>
      )}

      {/* Errores de tamaño */}
      {errores.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 space-y-1">
          {errores.map((e, i) => (
            <p key={i} className="text-xs text-red-400">{e} — archivo omitido</p>
          ))}
        </div>
      )}

      {/* Grid de fotos */}
      {fotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/10 rounded-xl text-center">
          <ImageOff className="w-12 h-12 text-white/20 mb-3" />
          <p className="text-white/40 text-sm">
            {soloLectura ? 'No hay fotos en la galería' : 'Aún no hay fotos — sube la primera'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className="relative group aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-black/40"
            >
              <img
                src={foto.url}
                alt="Foto de galería"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Badge principal */}
              {foto.es_principal && (
                <div className="absolute top-2 left-2">
                  <span className="bg-amber-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-lg">
                    Principal
                  </span>
                </div>
              )}

              {/* Overlay con acciones */}
              {!soloLectura && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                  {/* Marcar principal */}
                  <button
                    onClick={() => marcarPrincipal(foto.id)}
                    title={foto.es_principal ? 'Ya es principal' : 'Marcar como principal'}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all
                      ${foto.es_principal
                        ? 'bg-amber-400 border-amber-400 text-black cursor-default'
                        : 'border-amber-400/60 text-amber-400 hover:bg-amber-400 hover:text-black'
                      }`}
                  >
                    <Star className="w-4 h-4" fill={foto.es_principal ? 'currentColor' : 'none'} />
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => eliminarFoto(foto)}
                    title="Eliminar foto"
                    className="w-9 h-9 rounded-full border border-red-500/60 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
