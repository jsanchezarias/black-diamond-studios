/**
 * 🔧 SCRIPT DE CORRECCIÓN DE FOTOS DE MODELOS
 * Actualiza las URLs de fotos en Supabase con las correctas de sedesData.ts
 */

import { supabase } from '../../lib/supabaseClient';

export async function corregirFotosModelos() {
  console.log('🔧 Iniciando corrección de URLs de fotos...');

  const correcciones = [
    {
      email: 'isabella@blackdiamond.com',
      fotoPerfil: 'https://lh3.googleusercontent.com/d/1Wg94Vmh9nrYE60NNrA6-QHTxldsFhkLk',
      fotosAdicionales: [
        'https://lh3.googleusercontent.com/d/1Wg94Vmh9nrYE60NNrA6-QHTxldsFhkLk',
        'https://lh3.googleusercontent.com/d/1HwNiobsK53Xy8ILFc9Ff_cY5DSLDuTSO',
        'https://lh3.googleusercontent.com/d/1lvGfWC1q70ci0zJmrLrLGLQMm_QYYYBn',
        'https://lh3.googleusercontent.com/d/1v2lJI1GamCbCAkWXc9IuQyddhOFt8tpe',
        'https://lh3.googleusercontent.com/d/1Na5_w-cGBAbkPrjq7Fxt7qsWWdEjvovQ',
        'https://lh3.googleusercontent.com/d/1aElSnJzS8IsHOc5YMXI0hYG-NBfrxOLF',
        'https://lh3.googleusercontent.com/d/1wFPiBng8qV08wwU3Qh3X-_sEiW_iQAha',
        'https://lh3.googleusercontent.com/d/1VPSQhxw9SSuTq1O2zewUSNegDUUAEzbb',
        'https://lh3.googleusercontent.com/d/1frMHOaMDNlGIPecyBv-gI-BwFll4g-MY',
        'https://lh3.googleusercontent.com/d/1QPxGUJJ75kRrY0__VB2BH3qOShAgtZ1i',
        'https://lh3.googleusercontent.com/d/1fCr3kjDj9yEdZr-mRbvDCOJok3M0Rw4a',
        'https://lh3.googleusercontent.com/d/15YHAdLWymP9chWgMJvgar4FOAWytBlTw',
        'https://lh3.googleusercontent.com/d/12TZibn3yo4BAAYsx98NC1A4Y8y-aPWTk',
        'https://lh3.googleusercontent.com/d/1rCbsjtQk85Wx8eNUfqx7clM4ZrgneL8V',
        'https://lh3.googleusercontent.com/d/1TZUgr_VAKOHsWd85PqYBdXjfzMrP1EAh',
        'https://lh3.googleusercontent.com/d/1lB__Fniv21Q-Xrzf014ysIQwMP7v_BZl',
        'https://lh3.googleusercontent.com/d/1_dVGDIyUfo_d4gNbRVJBtpCBqkTvsKTA',
        'https://lh3.googleusercontent.com/d/1gTIwb_TiVZG8Ku39zPhCSikGwzKw2TzH',
        'https://lh3.googleusercontent.com/d/1n0K892PV3gF-hk6l3y9X2kFBroQ6X-57',
        'https://lh3.googleusercontent.com/d/1Uk0EXlW9Fps5iI8deI3p25VtdzoKjQMd'
      ]
    },
    {
      email: 'natalia@blackdiamond.com',
      fotoPerfil: 'https://lh3.googleusercontent.com/d/1WtMylIcZS_q3v9EabMtc2XHJVOa-Z9zd',
      fotosAdicionales: [
        'https://lh3.googleusercontent.com/d/1WtMylIcZS_q3v9EabMtc2XHJVOa-Z9zd',
        'https://lh3.googleusercontent.com/d/1a2MGs-SNBbHeIDKMFazY0bhRB8mexZmX',
        'https://lh3.googleusercontent.com/d/1nsy9-a0GzfkSGqmelENocWvLJIUpk4nW',
        'https://lh3.googleusercontent.com/d/1muyZ8hUHBjAnWwzFkBH5b-32UyNW6m2S',
        'https://lh3.googleusercontent.com/d/1DzwJ_CMDJIVfzAU5pcQuzK7atCAPuT_M',
        'https://lh3.googleusercontent.com/d/1XASRRRPDcZKqCW9qEJkU3Aa44hiEsO0T',
        'https://lh3.googleusercontent.com/d/1HT901QbCwPZSFpeP2In6vzROx9yOVG8v',
        'https://lh3.googleusercontent.com/d/1alKhvIhxt12aAXgnx9RtLHq5aiIIFzux',
        'https://lh3.googleusercontent.com/d/1fJ15q8UNTmN9M4wUsUa0QSGWSrNSn_Lk',
        'https://lh3.googleusercontent.com/d/1Wn9nIdiJyGQm06tB-QOGkf4y8oJuErT2',
        'https://lh3.googleusercontent.com/d/138XpIttRtqpEYEjWClbnPTnZTkjvGT6f',
        'https://lh3.googleusercontent.com/d/138qzkh2q0p6yvUsS8d0RAGHg58cF6kN4'
      ]
    },
    {
      email: 'ximena@blackdiamond.com',
      fotoPerfil: 'https://lh3.googleusercontent.com/d/15VwEzcm6jre_JugzQVF73LPnug1uKdtK',
      fotosAdicionales: [
        'https://lh3.googleusercontent.com/d/15VwEzcm6jre_JugzQVF73LPnug1uKdtK',
        'https://lh3.googleusercontent.com/d/1o4hVclJUNY-3oK1odRhGkEdPahR8SQGa',
        'https://lh3.googleusercontent.com/d/1dIDy6glfXmf7ZeLE0sG8Ez0NLUZvax7c',
        'https://lh3.googleusercontent.com/d/1OQMkE_xi7-tmDzaUgmGaa4bG8g4Jmtw8',
        'https://lh3.googleusercontent.com/d/1ih65oHBeDHehh6QgARSKhGDfouu5p7N6',
        'https://lh3.googleusercontent.com/d/1e67Tj3RVy617VE6fRqW2WRX2wvhwMbbN',
        'https://lh3.googleusercontent.com/d/1zd-p9FHMCLPd7gPMlDZ75Ot55JQp2L-X',
        'https://lh3.googleusercontent.com/d/1Nx_AeNRFCvqfWR8iN1lFm5HH9XYjmUgd',
        'https://lh3.googleusercontent.com/d/1Qgov7BZQkZ5UYrjPE3OKoLDxj-pR3gHj',
        'https://lh3.googleusercontent.com/d/11AUfvB5nYP8Gj5Yyx6pGgV_hJCx6g6Hh',
        'https://lh3.googleusercontent.com/d/1Yh7o7fV8ZNxP_rbKxlmICmGqY6y7TW1s',
        'https://lh3.googleusercontent.com/d/1Y80AyVbHW2XS4OFjCWdIElI1WQWw8Gd1',
        'https://lh3.googleusercontent.com/d/1hC-lRt5JWw-XFr7Fqf-nRUhbfWq0Dv9a',
        'https://lh3.googleusercontent.com/d/1Y-o0ot4EfQkIxnTHs9r7nGv9Xq7WEm1r',
        'https://lh3.googleusercontent.com/d/12IfCNCx7xv9F13zZ0A4lB5d4w2EVMPhj'
      ]
    }
  ];

  for (const correccion of correcciones) {
    try {
      console.log(`\n📝 Actualizando ${correccion.email}...`);
      console.log(`   Foto perfil: ${correccion.fotoPerfil.substring(0, 50)}...`);
      console.log(`   Total fotos adicionales: ${correccion.fotosAdicionales.length}`);

      const { data, error } = await supabase
        .from('usuarios')
        .update({
          fotoPerfil: correccion.fotoPerfil,
          fotosAdicionales: correccion.fotosAdicionales
        })
        .eq('email', correccion.email)
        .eq('role', 'modelo')
        .select();

      if (error) {
        console.error(`❌ Error actualizando ${correccion.email}:`, error);
      } else {
        console.log(`✅ ${correccion.email} actualizada correctamente`);
        console.log(`   Registros actualizados:`, data?.length || 0);
        if (data && data.length > 0) {
          console.log(`   Foto guardada: ${data[0].fotoPerfil?.substring(0, 50)}...`);
        }
      }
    } catch (err) {
      console.error(`❌ Error inesperado con ${correccion.email}:`, err);
    }
  }

  console.log('\n🎉 Corrección de URLs completada!');
}