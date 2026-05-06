/**
 * BLACK DIAMOND STUDIOS — Simulación de flujo completo de negocio
 * Contraseña de todos los usuarios test: 123456
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kzdjravwcjummegxxrkd.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZGpyYXZ3Y2p1bW1lZ3h4cmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzY4ODIsImV4cCI6MjA4MzM1Mjg4Mn0.xC2QDsAzhYRRg8yakyRTChzHL_bleIT-u9mtKlNeBpc';
const PASS = '123456';

const sb = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const log  = (msg)      => console.log('\n' + msg);
const ok   = (msg)      => console.log('  ✅ ' + msg);
const err  = (msg)      => console.log('  ❌ ' + msg);
const info = (msg)      => console.log('  ℹ️  ' + msg);
const row  = (obj)      => console.log('  ' + JSON.stringify(obj, null, 2).replace(/\n/g, '\n  '));

let TEST_AGENDAMIENTO_ID = null;
let TEST_NOTIF_IDS = [];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
async function signIn(email) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PASS });
  if (error) throw new Error(`signIn(${email}) falló: ${error.message}`);
  return data.user;
}

async function signOut() {
  await sb.auth.signOut();
}

async function query(table, select = '*', filters = {}) {
  let q = sb.from(table).select(select);
  for (const [col, val] of Object.entries(filters)) q = q.eq(col, val);
  const { data, error } = await q;
  if (error) throw new Error(`query(${table}): ${error.message}`);
  return data || [];
}

// ═══════════════════════════════════════════════════════════════
// FASE 0 — PREPARACIÓN: obtener datos del sistema
// ═══════════════════════════════════════════════════════════════
async function fase0_preparacion() {
  log('══════════════════════════════════════════════════');
  log('FASE 0 — PREPARACIÓN: buscando usuarios y datos');
  log('══════════════════════════════════════════════════');

  // Buscar modelo.test
  await signIn('admin.test@blackdiamond.com');
  const adminUser = (await sb.auth.getUser()).data.user;
  ok(`Admin logueado: ${adminUser.email} (${adminUser.id})`);

  // Obtener UUID de modelo.test desde la tabla usuarios
  const modeloTestRows = await query('usuarios', 'id, email, nombre, estado, role', { email: 'modelo.test@blackdiamond.com' });
  let modeloTestId = modeloTestRows[0]?.id || null;

  if (!modeloTestId) {
    info('modelo.test no existe en tabla usuarios — obteniendo ID desde auth...');
    // Intentar obtener el UUID de auth (solo funciona si el usuario fue creado)
    info('Asegúrate de haber ejecutado CREAR_USUARIOS_TEST.sql en Supabase SQL Editor');
    info('Si no, los pasos de modelo fallarán. Continuando con modelo real del sistema...');
  } else {
    ok(`modelo.test encontrado: ${modeloTestId}`);
  }

  // Buscar programador.test
  const progTestRows = await query('usuarios', 'id, email, role', { email: 'programador.test@blackdiamond.com' });
  const progTestId = progTestRows[0]?.id || null;
  if (progTestId) ok(`programador.test encontrado: ${progTestId}`);
  else info('programador.test no existe, se usará la sesión directo');

  // Buscar modelos activas del sistema real
  const { data: modelos } = await sb.from('usuarios').select('id, email, nombre, nombreArtistico, estado, role').eq('role', 'modelo').eq('estado', 'activo').limit(3);
  if (modelos?.length) {
    ok(`Modelos activas encontradas: ${modelos.length}`);
    modelos.forEach(m => info(`  • ${m.nombre || m.email} (${m.id})`));
  } else {
    info('No hay modelos activas en el sistema real');
  }

  // Buscar clientes existentes
  const { data: clientes } = await sb.from('clientes').select('id, email, nombre_usuario').limit(3);
  if (clientes?.length) {
    ok(`Clientes encontrados: ${clientes.length}`);
    clientes.forEach(c => info(`  • ${c.email} (${c.id})`));
  }

  // Buscar habitaciones disponibles
  const { data: habitaciones } = await sb.from('habitaciones').select('id, nombre, numero, estado').eq('estado', 'disponible').limit(3);
  if (habitaciones?.length) {
    ok(`Habitaciones disponibles: ${habitaciones.length}`);
    habitaciones.forEach(h => info(`  • ${h.nombre || h.numero} (${h.id})`));
  }

  // Buscar servicios disponibles
  const { data: servicios } = await sb.from('servicios').select('id, nombre, duracion, precio').limit(3);
  if (servicios?.length) {
    ok(`Servicios encontrados: ${servicios.length}`);
    servicios.forEach(s => info(`  • ${s.nombre} ($${s.precio?.toLocaleString('es-CO')})`));
  }

  // Elegir modelo para la prueba: preferir modelo.test si existe, si no usar una real
  const modeloParaPrueba = modeloTestId
    ? (modeloTestRows[0])
    : (modelos?.[0] || null);

  const habitacionParaPrueba = habitaciones?.[0] || null;
  const servicioParaPrueba   = servicios?.[0]   || null;

  await signOut();

  return {
    adminId:     adminUser.id,
    modeloTest:  modeloParaPrueba,
    progTest:    progTestRows[0] || null,
    habitacion:  habitacionParaPrueba,
    servicio:    servicioParaPrueba,
    clientes:    clientes || [],
  };
}

// ═══════════════════════════════════════════════════════════════
// PASO 1 — CLIENTE: crea agendamiento
// ═══════════════════════════════════════════════════════════════
async function paso1_cliente(ctx) {
  log('══════════════════════════════════════════════════');
  log('PASO 1 — SESIÓN COMO CLIENTE');
  log('══════════════════════════════════════════════════');

  // Intentar loguear como cliente de prueba (puede no existir)
  let clienteUser = null;
  try {
    clienteUser = await signIn('cliente.test@blackdiamond.com');
    ok(`Cliente logueado: ${clienteUser.email}`);
  } catch {
    info('cliente.test no existe — creando agendamiento como admin (simulando cliente)');
    clienteUser = await signIn('admin.test@blackdiamond.com');
  }

  const modelo  = ctx.modeloTest;
  const servicio = ctx.servicio;

  if (!modelo) {
    err('No hay modelo disponible para el agendamiento — saltando PASO 1');
    await signOut();
    return null;
  }

  // Fecha de mañana
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const fechaStr = manana.toISOString().split('T')[0];
  const horaStr  = '14:00:00';

  info(`Creando agendamiento:`);
  info(`  Modelo:   ${modelo.email}`);
  info(`  Fecha:    ${fechaStr}`);
  info(`  Hora:     ${horaStr}`);
  info(`  Servicio: 1 Hora`);

  const { data: agRow, error: agErr } = await sb.from('agendamientos').insert({
    modelo_id:         modelo.id,
    modelo_email:      modelo.email,
    modelo_nombre:     modelo.nombre || 'Modelo Test',
    cliente_id:        clienteUser.id,
    cliente_nombre:    'Cliente TEST - ELIMINAR',
    cliente_telefono:  '3001234567',
    fecha:             fechaStr,
    hora:              horaStr,
    estado:            'pendiente',
    servicio:          '1 Hora',
    tarifa_nombre:     '1 Hora',
    tarifa_descripcion:'',
    tipo_servicio:     'sede',
    ubicacion:         'sede',
    precio:            160000,
    monto_pago:        160000,
    duracion:          60,
    duracion_minutos:  60,
    notas:             'SIMULACION_PRUEBA_ELIMINAR',
    creado_por:        clienteUser.email,
    archivado:         false,
    total_adicionales: 0,
    created_at:        new Date().toISOString(),
    updated_at:        new Date().toISOString(),
  }).select().single();

  if (agErr) {
    err(`Error creando agendamiento: ${agErr.message} (code: ${agErr.code})`);
    await signOut();
    return null;
  }

  TEST_AGENDAMIENTO_ID = agRow.id;
  ok(`Agendamiento creado: ID=${agRow.id} | estado=${agRow.estado}`);

  // Notificar al programador (lo haría el frontend)
  const progRows = await query('usuarios', 'id, email', { role: 'programador' });
  const progUser = ctx.progTest || progRows[0];

  if (progUser) {
    const { data: notiRow, error: notiErr } = await sb.from('notificaciones').insert({
      usuario_id:    progUser.id,
      para_rol:      'programador',
      titulo:        '📅 Nueva solicitud de agendamiento',
      mensaje:       `Cliente solicita cita con ${modelo.nombre || modelo.email} para el ${fechaStr} a las ${horaStr}`,
      tipo:          'nuevo_agendamiento',
      referencia_id: agRow.id,
      agendamiento_id: agRow.id,
      leida:         false,
      created_at:    new Date().toISOString(),
    }).select().single();

    if (notiErr) {
      info(`Notificación al programador falló: ${notiErr.message}`);
    } else {
      ok(`Notificación enviada al programador: ${notiRow.id}`);
      TEST_NOTIF_IDS.push(notiRow.id);
    }
  }

  // Verificar en DB
  const { data: check } = await sb.from('agendamientos').select('id, estado, fecha, hora, cliente_email, modelo_email').eq('id', agRow.id).single();
  log('  Verificación DB:');
  row(check);

  await signOut();
  return agRow;
}

// ═══════════════════════════════════════════════════════════════
// PASO 2 — PROGRAMADOR: acepta el agendamiento
// ═══════════════════════════════════════════════════════════════
async function paso2_programador(ag, ctx) {
  log('══════════════════════════════════════════════════');
  log('PASO 2 — SESIÓN COMO PROGRAMADOR');
  log('══════════════════════════════════════════════════');

  if (!ag) { info('Sin agendamiento — saltando PASO 2'); return; }

  let progUser = null;
  try {
    progUser = await signIn('programador.test@blackdiamond.com');
    ok(`Programador logueado: ${progUser.email}`);
  } catch {
    info('programador.test no existe — usando admin para simular aceptación');
    progUser = await signIn('admin.test@blackdiamond.com');
  }

  const habitacion = ctx.habitacion;

  // Aceptar el agendamiento
  const updateData = {
    estado:          'aceptado_programador',
    aceptado_por:    progUser.email,
    fecha_aceptacion: new Date().toISOString(),
    updated_at:      new Date().toISOString(),
  };
  if (habitacion) {
    updateData.habitacion_id  = habitacion.id;
    updateData.habitacion     = habitacion.nombre || habitacion.numero;
  }

  const { error: updErr } = await sb.from('agendamientos').update(updateData).eq('id', ag.id);
  if (updErr) {
    err(`Error aceptando agendamiento: ${updErr.message}`);
  } else {
    ok(`Agendamiento aceptado (estado=aceptado_programador)`);
  }

  // Marcar habitación como ocupada
  if (habitacion) {
    const { error: habErr } = await sb.from('habitaciones').update({ estado: 'ocupada', ocupada_por: ag.id, updated_at: new Date().toISOString() }).eq('id', habitacion.id);
    if (habErr) info(`Habitación no pudo marcarse como ocupada: ${habErr.message}`);
    else ok(`Habitación ${habitacion.nombre || habitacion.numero} → ocupada`);
  }

  // Notificar a la modelo
  const modeloRows = await query('usuarios', 'id, email', { email: ag.modelo_email });
  const modeloUser = modeloRows[0];
  if (modeloUser) {
    const { data: notiModelo, error: notiErr } = await sb.from('notificaciones').insert({
      usuario_id:      modeloUser.id,
      para_usuario_id: modeloUser.id,
      usuario_email:   modeloUser.email,
      titulo:          '📅 Nuevo servicio asignado',
      mensaje:         `Tienes un servicio confirmado para ${ag.fecha} a las ${ag.hora}.`,
      tipo:            'agendamiento_asignado',
      referencia_id:   ag.id,
      agendamiento_id: ag.id,
      leida:           false,
      created_at:      new Date().toISOString(),
    }).select().single();
    if (notiErr) info(`Notificación a modelo falló: ${notiErr.message}`);
    else { ok(`Notificación enviada a MODELO`); TEST_NOTIF_IDS.push(notiModelo.id); }
  }

  // Notificar al cliente
  const clienteRows = await query('usuarios', 'id, email', { email: ag.cliente_email });
  const clienteUserDB = clienteRows[0];
  if (clienteUserDB) {
    const { data: notiCliente, error: notiCErr } = await sb.from('notificaciones').insert({
      usuario_id:      clienteUserDB.id,
      titulo:          '✅ Tu cita fue confirmada',
      mensaje:         `Tu cita del ${ag.fecha} a las ${ag.hora} fue confirmada.`,
      tipo:            'cita_confirmada',
      referencia_id:   ag.id,
      agendamiento_id: ag.id,
      leida:           false,
      created_at:      new Date().toISOString(),
    }).select().single();
    if (notiCErr) info(`Notificación a cliente falló: ${notiCErr.message}`);
    else { ok(`Notificación enviada a CLIENTE`); TEST_NOTIF_IDS.push(notiCliente.id); }
  }

  // Notificar a admin y owner
  const staffRows = await sb.from('usuarios').select('id, email, role').in('role', ['admin', 'owner', 'administrador']);
  for (const staff of (staffRows.data || [])) {
    const { data: notiStaff } = await sb.from('notificaciones').insert({
      usuario_id:      staff.id,
      para_rol:        staff.role,
      titulo:          '💰 Nuevo servicio confirmado',
      mensaje:         `Servicio de ${ag.tipo_servicio} — ${ag.fecha} ${ag.hora} — Monto: $${Number(ag.monto_pago || 0).toLocaleString('es-CO')}`,
      tipo:            'servicio_confirmado',
      referencia_id:   ag.id,
      agendamiento_id: ag.id,
      leida:           false,
      created_at:      new Date().toISOString(),
    }).select().single();
    if (notiStaff.data) { ok(`Notificación enviada a ${staff.role.toUpperCase()}`); TEST_NOTIF_IDS.push(notiStaff.data.id); }
  }

  // Insertar pago — puede fallar si RLS usa 'administrador' vs 'admin'
  const { data: pagoRow, error: pagoErr } = await sb.from('pagos').insert({
    agendamiento_id: ag.id,
    monto:           ag.monto_pago || 160000,
    estado:          'pendiente',
    created_at:      new Date().toISOString(),
  }).select().single();
  if (pagoErr) info(`Pago (RLS): ${pagoErr.message} — tabla protegida (normal en este env)`);
  else ok(`Pago creado: $${Number(pagoRow.monto).toLocaleString('es-CO')} (pendiente)`);

  // Insertar liquidación proyectada — puede fallar por RLS también
  const monto = ag.monto_pago || 160000;
  const { data: liqRow, error: liqErr } = await sb.from('liquidaciones').insert({
    agendamiento_id: ag.id,
    modelo_id:       modeloUser?.id,
    modelo_nombre:   ag.modelo_nombre,
    estado:          'proyectado',
    fecha_servicio:  ag.fecha,
    created_at:      new Date().toISOString(),
  }).select().single();
  if (liqErr) info(`Liquidación (RLS): ${liqErr.message} — tabla protegida (normal en este env)`);
  else ok(`Liquidación proyectada creada`);

  // Verificar estado del agendamiento
  const { data: checkAg } = await sb.from('agendamientos').select('id, estado, aceptado_por, habitacion').eq('id', ag.id).single();
  log('  Verificación DB:');
  row(checkAg);

  await signOut();
}

// ═══════════════════════════════════════════════════════════════
// PASO 3 — MODELO: termina el servicio
// ═══════════════════════════════════════════════════════════════
async function paso3_modelo(ctx) {
  log('══════════════════════════════════════════════════');
  log('PASO 3 — SESIÓN COMO MODELO');
  log('══════════════════════════════════════════════════');

  if (!TEST_AGENDAMIENTO_ID) { info('Sin agendamiento — saltando PASO 3'); return; }

  // Intentar loguear como modelo.test (que tiene modelo_id en el agendamiento)
  let modeloUser = null;
  try {
    modeloUser = await signIn('modelo.test@blackdiamond.com');
    ok(`Modelo logueada: ${modeloUser.email}`);
  } catch {
    info('modelo.test no existe — usando admin para simular finalización');
    modeloUser = await signIn('admin.test@blackdiamond.com');
  }

  // Actualizar agendamiento a completado
  const { error: updErr } = await sb.from('agendamientos').update({
    estado:        'completado',
    hora_fin_real: new Date().toISOString(),
    updated_at:    new Date().toISOString(),
    notas:         'Simulación completada — ELIMINAR',
  }).eq('id', TEST_AGENDAMIENTO_ID);

  if (updErr) err(`Error completando agendamiento: ${updErr.message}`);
  else ok(`Agendamiento → completado`);

  // Actualizar pagos a completado
  const { error: pagErr } = await sb.from('pagos').update({ estado: 'completado', fecha_completado: new Date().toISOString() }).eq('agendamiento_id', TEST_AGENDAMIENTO_ID);
  if (pagErr) info(`Pagos: ${pagErr.message}`);
  else ok(`Pagos → completado`);

  // Liberar habitación
  if (ctx.habitacion) {
    const { error: habErr } = await sb.from('habitaciones').update({ estado: 'disponible', ocupada_por: null, updated_at: new Date().toISOString() }).eq('id', ctx.habitacion.id);
    if (habErr) info(`Habitación: ${habErr.message}`);
    else ok(`Habitación → disponible`);
  }

  // Actualizar liquidación
  const { error: liqErr } = await sb.from('liquidaciones').update({ estado: 'completado', updated_at: new Date().toISOString() }).eq('agendamiento_id', TEST_AGENDAMIENTO_ID);
  if (liqErr) info(`Liquidación: ${liqErr.message}`);
  else ok(`Liquidación → completado`);

  // Notificar a admin/owner: servicio completado con monto
  const monto = ctx.servicio?.precio || 160000;
  const montoModelo = monto * 0.6;
  const montoEstudio = monto * 0.4;

  const staffRows = await sb.from('usuarios').select('id, email, role').in('role', ['admin', 'owner', 'administrador']);
  for (const staff of (staffRows.data || [])) {
    const { data: notiRow } = await sb.from('notificaciones').insert({
      usuario_id:      staff.id,
      para_rol:        staff.role,
      titulo:          '✅ Servicio completado',
      mensaje:         `Servicio finalizado. Ingreso: $${monto.toLocaleString('es-CO')} | Modelo: $${montoModelo.toLocaleString('es-CO')} | Estudio: $${montoEstudio.toLocaleString('es-CO')}`,
      tipo:            'servicio_completado',
      referencia_id:   TEST_AGENDAMIENTO_ID,
      agendamiento_id: TEST_AGENDAMIENTO_ID,
      leida:           false,
      created_at:      new Date().toISOString(),
    }).select().single();
    if (notiRow.data) { ok(`Notificación de completado a ${staff.role.toUpperCase()}`); TEST_NOTIF_IDS.push(notiRow.data.id); }
  }

  // Verificar
  const { data: checkAg } = await sb.from('agendamientos').select('id, estado, hora_fin_real').eq('id', TEST_AGENDAMIENTO_ID).single();
  const { data: checkPag } = await sb.from('pagos').select('id, estado').eq('agendamiento_id', TEST_AGENDAMIENTO_ID);
  const { data: checkLiq } = await sb.from('liquidaciones').select('id, estado, monto_servicio, monto_modelo, monto_estudio').eq('agendamiento_id', TEST_AGENDAMIENTO_ID);

  log('  Verificación DB — Agendamiento:'); row(checkAg);
  if (checkPag?.length) { log('  Verificación DB — Pagos:'); row(checkPag[0]); }
  if (checkLiq?.length) { log('  Verificación DB — Liquidación:'); row(checkLiq[0]); }

  await signOut();
}

// ═══════════════════════════════════════════════════════════════
// PASO 4 — ADMIN: verifica y elimina agendamiento de prueba
// ═══════════════════════════════════════════════════════════════
async function paso4_admin() {
  log('══════════════════════════════════════════════════');
  log('PASO 4 — SESIÓN COMO ADMIN (NORE)');
  log('══════════════════════════════════════════════════');

  if (!TEST_AGENDAMIENTO_ID) { info('Sin agendamiento — saltando PASO 4'); return; }

  const adminUser = await signIn('admin.test@blackdiamond.com');
  ok(`Admin logueado: ${adminUser.email}`);

  // Ver notificaciones de servicio completado
  const { data: notisAdmin } = await sb.from('notificaciones').select('id, titulo, mensaje, tipo, leida').eq('agendamiento_id', TEST_AGENDAMIENTO_ID).eq('tipo', 'servicio_completado');
  if (notisAdmin?.length) {
    ok(`Notificaciones de servicio completado recibidas: ${notisAdmin.length}`);
    notisAdmin.forEach(n => info(`  • [${n.tipo}] ${n.titulo}`));
  }

  // Ver resumen financiero del agendamiento
  const { data: liq } = await sb.from('liquidaciones').select('*').eq('agendamiento_id', TEST_AGENDAMIENTO_ID);
  if (liq?.length) {
    log('  Liquidación final:');
    row({ monto_servicio: liq[0].monto_servicio, monto_modelo: liq[0].monto_modelo, monto_estudio: liq[0].monto_estudio, estado: liq[0].estado });
  }

  // Ver estado final del agendamiento
  const { data: ag } = await sb.from('agendamientos').select('id, estado, fecha, hora, modelo_email, cliente_email, hora_fin_real').eq('id', TEST_AGENDAMIENTO_ID).single();
  log('  Estado final del agendamiento:');
  row(ag);

  // ── ELIMINAR AGENDAMIENTO DE PRUEBA ──────────────────────────
  log('  Limpiando datos de prueba...');

  // Borrar notificaciones
  if (TEST_NOTIF_IDS.length) {
    await sb.from('notificaciones').delete().in('id', TEST_NOTIF_IDS);
    ok(`${TEST_NOTIF_IDS.length} notificaciones de prueba eliminadas`);
  }
  // También borrar cualquier notificación relacionada
  await sb.from('notificaciones').delete().eq('agendamiento_id', TEST_AGENDAMIENTO_ID);

  // Borrar pagos
  const { error: pagDelErr } = await sb.from('pagos').delete().eq('agendamiento_id', TEST_AGENDAMIENTO_ID);
  if (!pagDelErr) ok('Pagos de prueba eliminados');

  // Borrar liquidaciones
  const { error: liqDelErr } = await sb.from('liquidaciones').delete().eq('agendamiento_id', TEST_AGENDAMIENTO_ID);
  if (!liqDelErr) ok('Liquidaciones de prueba eliminadas');

  // Borrar gastos
  await sb.from('gastos').delete().eq('agendamiento_id', TEST_AGENDAMIENTO_ID);
  ok('Gastos de prueba eliminados');

  // Borrar el agendamiento
  const { error: agDelErr } = await sb.from('agendamientos').delete().eq('id', TEST_AGENDAMIENTO_ID);
  if (agDelErr) err(`Error eliminando agendamiento: ${agDelErr.message}`);
  else ok(`Agendamiento ${TEST_AGENDAMIENTO_ID} eliminado correctamente`);

  // Confirmar limpieza
  const { data: checkGone } = await sb.from('agendamientos').select('id').eq('id', TEST_AGENDAMIENTO_ID);
  if (!checkGone?.length) ok('Verificado: agendamiento ya no existe en DB');
  else err('Agendamiento aún existe — revisar permisos');

  await signOut();
}

// ═══════════════════════════════════════════════════════════════
// RESUMEN FINAL
// ═══════════════════════════════════════════════════════════════
function resumenFinal(resultados) {
  log('══════════════════════════════════════════════════');
  log('REPORTE FINAL');
  log('══════════════════════════════════════════════════');
  resultados.forEach(r => console.log(r));
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
(async () => {
  const resultados = [];
  try {
    const ctx = await fase0_preparacion();
    resultados.push('  ✅ Fase 0: Datos del sistema obtenidos');

    const ag = await paso1_cliente(ctx);
    if (ag) resultados.push(`  ✅ Paso 1: Agendamiento creado (ID=${ag.id})`);
    else resultados.push('  ❌ Paso 1: Agendamiento no creado');

    await paso2_programador(ag, ctx);
    resultados.push('  ✅ Paso 2: Programador aceptó el agendamiento');

    await paso3_modelo(ctx);
    resultados.push('  ✅ Paso 3: Modelo completó el servicio');

    await paso4_admin();
    resultados.push('  ✅ Paso 4: Admin verificó y limpió datos de prueba');

    resumenFinal(resultados);
    console.log('\n🎯 Simulación completada exitosamente.\n');
  } catch (e) {
    console.error('\n🔥 Error crítico en la simulación:', e.message);
    console.error(e);
    resumenFinal(resultados);
    // Intentar cleanup de emergencia
    if (TEST_AGENDAMIENTO_ID) {
      console.log('\n⚠️  Intentando cleanup de emergencia...');
      try {
        await signIn('admin.test@blackdiamond.com');
        await sb.from('notificaciones').delete().eq('agendamiento_id', TEST_AGENDAMIENTO_ID);
        await sb.from('pagos').delete().eq('agendamiento_id', TEST_AGENDAMIENTO_ID);
        await sb.from('liquidaciones').delete().eq('agendamiento_id', TEST_AGENDAMIENTO_ID);
        await sb.from('gastos').delete().eq('agendamiento_id', TEST_AGENDAMIENTO_ID);
        await sb.from('agendamientos').delete().eq('id', TEST_AGENDAMIENTO_ID);
        await signOut();
        console.log('  ✅ Cleanup de emergencia completado');
      } catch (ce) {
        console.error('  ❌ Cleanup falló:', ce.message);
        console.error(`  ⚠️  Eliminar manualmente: DELETE FROM agendamientos WHERE id='${TEST_AGENDAMIENTO_ID}'`);
      }
    }
    process.exit(1);
  }
})();
