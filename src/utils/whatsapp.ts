/**
 * Configuración centralizada y generador de enlaces de WhatsApp para Black Diamond
 */

export const WHATSAPP_CONFIG = {
  numero: '573143107403',
  cleanNumber: '3143107403',
  display: '+57 314 310 7403',
  displayShort: '314 310 7403',
} as const;

/**
 * Enlace general para atención personalizada y consultas directas
 */
export function getWhatsAppGeneralUrl(mensajePersonalizado?: string): string {
  const msg = mensajePersonalizado || '¡Hola Black Diamond! Deseo recibir atención personalizada e información sobre sus servicios exclusivos.';
  return `https://wa.me/${WHATSAPP_CONFIG.numero}?text=${encodeURIComponent(msg)}`;
}

/**
 * Enlace para agendar o consultar por una modelo específica (con o sin tarifa)
 */
export function getWhatsAppModeloUrl(
  nombreModelo: string,
  servicio?: { nombre: string; precio: number }
): string {
  let msg = '';
  if (servicio) {
    const precioFmt = '$' + Number(servicio.precio).toLocaleString('es-CO');
    msg = `¡Hola Black Diamond! Me gustaría coordinar un encuentro con *${nombreModelo}* para el servicio de *${servicio.nombre}* (${precioFmt}). ¿Tienen disponibilidad de agenda?`;
  } else {
    msg = `¡Hola Black Diamond! Me gustaría consultar disponibilidad de agenda y coordinar un encuentro con *${nombreModelo}*.`;
  }
  return `https://wa.me/${WHATSAPP_CONFIG.numero}?text=${encodeURIComponent(msg)}`;
}

/**
 * Enlace con resumen estructurado y detallado para reservas desde el perfil público
 */
export function getWhatsAppReservaCompletaUrl({
  nombreModelo,
  servicioNombre,
  precio,
  modalidad,
  direccion,
  fecha,
  hora,
  notas,
}: {
  nombreModelo: string;
  servicioNombre: string;
  precio: number;
  modalidad: 'sede' | 'domicilio';
  direccion?: string;
  fecha?: string;
  hora?: string;
  notas?: string;
}): string {
  const precioFmt = '$' + Number(precio).toLocaleString('es-CO');
  const modalidadFmt = modalidad === 'domicilio'
    ? `A Domicilio (${direccion?.trim() || 'Dirección a coordinar'})`
    : 'En Sede Exclusiva';

  const lineas = [
    '✨ *SOLICITUD DE RESERVA — BLACK DIAMOND* ✨',
    '',
    `👤 *Modelo:* ${nombreModelo}`,
    `💎 *Servicio:* ${servicioNombre} (${precioFmt})`,
    `📍 *Modalidad:* ${modalidadFmt}`,
  ];

  if (fecha) lineas.push(`📅 *Fecha:* ${fecha}`);
  if (hora) lineas.push(`⏰ *Hora:* ${hora}`);
  if (notas?.trim()) lineas.push(`📝 *Detalles adicionales:* ${notas.trim()}`);

  lineas.push('');
  lineas.push('Quedo atento a su confirmación y disponibilidad. ¡Muchas gracias!');

  return `https://wa.me/${WHATSAPP_CONFIG.numero}?text=${encodeURIComponent(lineas.join('\n'))}`;
}
