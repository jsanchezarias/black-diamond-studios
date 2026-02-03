/**
 * 🔍 SCRIPT DE DEPURACIÓN - Verificar URLs de Modelos
 * Lee directamente de Supabase para ver qué URLs tienen las modelos
 */

import { supabase } from '../../lib/supabaseClient';

export async function debugModelos() {
  console.log('🔍 Iniciando depuración de modelos...\n');

  try {
    // 1. Primero verificar cuántos usuarios con role=modelo existen
    const { data: todosModelos, error: errorTodos } = await supabase
      .from('usuarios')
      .select('*')
      .eq('role', 'modelo');

    console.log(`📊 Total de usuarios con role='modelo': ${todosModelos?.length || 0}\n`);

    if (errorTodos) {
      console.error('❌ Error consultando todos los modelos:', errorTodos);
    }

    // 2. Buscar específicamente las 3 modelos que queremos
    const { data: modelos, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('role', 'modelo')
      .in('email', [
        'isabella@blackdiamond.com',
        'natalia@blackdiamond.com',
        'ximena@blackdiamond.com'
      ]);

    if (error) {
      console.error('❌ Error consultando modelos específicas:', error);
      return;
    }

    console.log(`📊 Modelos específicas encontradas: ${modelos?.length || 0}\n`);

    if (!modelos || modelos.length === 0) {
      console.log('⚠️ No se encontraron las modelos Isabella, Natalia o Ximena');
      console.log('\n🔍 Veamos TODOS los emails en la tabla usuarios:');
      
      const { data: todosEmails } = await supabase
        .from('usuarios')
        .select('email, role, nombre');
      
      todosEmails?.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email} (${u.role}) - ${u.nombre || 'Sin nombre'}`);
      });
      return;
    }

    modelos.forEach((modelo, index) => {
      console.log(`${'='.repeat(70)}`);
      console.log(`👤 Modelo ${index + 1}: ${modelo.nombre || 'SIN NOMBRE'}`);
      console.log(`📧 Email: ${modelo.email}`);
      console.log(`🎭 Role: ${modelo.role}`);
      console.log(`🆔 ID: ${modelo.id}`);
      console.log(`\n📸 Foto de Perfil:`);
      console.log(`   ${modelo.fotoPerfil || '❌ SIN FOTO'}`);
      
      if (modelo.fotosAdicionales && Array.isArray(modelo.fotosAdicionales)) {
        console.log(`\n📸 Fotos Adicionales (${modelo.fotosAdicionales.length}):`);
        modelo.fotosAdicionales.slice(0, 3).forEach((foto, i) => {
          console.log(`   ${i + 1}. ${foto}`);
        });
        if (modelo.fotosAdicionales.length > 3) {
          console.log(`   ... y ${modelo.fotosAdicionales.length - 3} más`);
        }
      } else {
        console.log(`\n📸 Fotos Adicionales: ❌ SIN FOTOS`);
      }
      
      console.log(`\n📝 Otros campos:`);
      console.log(`   - nombreArtistico: ${modelo.nombreArtistico || 'N/A'}`);
      console.log(`   - edad: ${modelo.edad || 'N/A'}`);
      console.log(`   - activa: ${modelo.activa !== undefined ? modelo.activa : 'N/A'}`);
      console.log(`${'='.repeat(70)}\n`);
    });

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}