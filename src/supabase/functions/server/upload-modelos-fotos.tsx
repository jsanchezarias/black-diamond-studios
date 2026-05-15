/**
 * 📸 Endpoints para subir fotos de modelos a Supabase Storage
 * Usa el service role key para bypasear RLS
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Cliente con permisos completos (service role)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = "fotos-modelos";

/**
 * Asegura que el bucket existe, si no lo crea
 */
export async function ensureBucketExists() {
  console.log("📦 Verificando bucket fotos-modelos...");

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error("❌ Error listando buckets:", listError);
    throw new Error(`Error listando buckets: ${listError.message}`);
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME);

  if (!bucketExists) {
    console.log("📦 Creando bucket fotos-modelos...");

    const { data, error: createError } = await supabase.storage.createBucket(
      BUCKET_NAME,
      {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/jpg",
        ],
      }
    );

    if (createError) {
      console.error("❌ Error creando bucket:", createError);
      throw new Error(`Error creando bucket: ${createError.message}`);
    }

    console.log("✅ Bucket creado exitosamente");
  } else {
    console.log("✅ Bucket ya existe");
  }
}

/**
 * Sube un archivo a Supabase Storage
 */
export async function uploadFile(
  fileName: string,
  fileData: Uint8Array,
  contentType: string
): Promise<string> {
  console.log(`📤 Subiendo archivo: ${fileName}`);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, fileData, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error(`❌ Error subiendo ${fileName}:`, error);
    throw new Error(`Error subiendo archivo: ${error.message}`);
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  console.log(`✅ Archivo subido: ${urlData.publicUrl}`);
  return urlData.publicUrl;
}

/**
 * Actualiza las URLs de fotos de una modelo en la base de datos
 */
export async function updateModeloFotos(
  email: string,
  fotoPerfil?: string,
  fotosAdicionales?: string[]
): Promise<void> {
  console.log(`💾 Actualizando fotos para ${email}...`);

  const updateData: any = {};
  if (fotoPerfil) updateData.fotoPerfil = fotoPerfil;
  if (fotosAdicionales && fotosAdicionales.length > 0) {
    updateData.fotosAdicionales = fotosAdicionales;
  }

  const { error } = await supabase
    .from("usuarios")
    .update(updateData)
    .eq("email", email)
    .eq("role", "modelo");

  if (error) {
    console.error(`❌ Error actualizando BD para ${email}:`, error);
    throw new Error(`Error actualizando BD: ${error.message}`);
  }

  console.log(`✅ Fotos actualizadas para ${email}`);
}

/**
 * Elimina un archivo del storage
 */
export async function deleteFile(fileName: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);

  if (error) {
    console.error(`❌ Error eliminando ${fileName}:`, error);
    throw new Error(`Error eliminando archivo: ${error.message}`);
  }

  console.log(`🗑️ Archivo eliminado: ${fileName}`);
}
