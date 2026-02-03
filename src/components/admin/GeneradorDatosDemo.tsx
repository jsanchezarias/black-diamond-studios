import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Database, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner@2.0.3';

interface LogEntry {
  tipo: 'success' | 'error' | 'info';
  mensaje: string;
  timestamp: Date;
}

export function GeneradorDatosDemo() {
  const [generando, setGenerando] = useState(false);
  const [progreso, setProgreso] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [completado, setCompletado] = useState(false);

  // 🔑 Cliente de Supabase con SERVICE_ROLE_KEY para bypassear RLS
  const getAdminClient = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Faltan credenciales de Supabase en las variables de entorno');
    }
    
    return createClient(supabaseUrl, supabaseServiceKey);
  };

  const addLog = (tipo: 'success' | 'error' | 'info', mensaje: string) => {
    setLogs(prev => [...prev, { tipo, mensaje, timestamp: new Date() }]);
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
  };

  // Función para generar cliente aleatorio
  const generarCliente = () => {
    const nombres = ['Juan', 'Carlos', 'Miguel', 'Andrés', 'Luis', 'Fernando', 'Roberto', 'Diego', 'Jorge', 'Pedro'];
    const apellidos = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores'];
    
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
    const telefono = `300${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    return {
      nombre: `${nombre} ${apellido}`,
      telefono,
      email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@email.com`
    };
  };

  // Función para generar fecha aleatoria en los últimos 90 días
  const generarFechaAleatoria = (diasAtras: number = 90) => {
    const ahora = new Date();
    const diasAleatorios = Math.floor(Math.random() * diasAtras);
    const fecha = new Date(ahora.getTime() - diasAleatorios * 24 * 60 * 60 * 1000);
    
    // Hora entre 14:00 y 23:00
    const hora = 14 + Math.floor(Math.random() * 9);
    const minuto = Math.floor(Math.random() * 60);
    
    fecha.setHours(hora, minuto, 0, 0);
    return fecha;
  };

  const generarDatosDemo = async () => {
    setGenerando(true);
    setProgreso('Iniciando generación de datos...');
    setLogs([]);
    setCompletado(false);

    try {
      addLog('info', '🚀 Iniciando generación de datos demo para Black Diamond App');

      // 0. PRIMERO: Verificar qué tablas existen
      addLog('info', '🔍 Verificando tablas disponibles en Supabase...');
      
      // ✅ Tablas según DICCIONARIO_DATOS_BLACK_DIAMOND.md
      const tablasAVerificar = [
        'usuarios',                  // ✅ Existe
        'agendamientos',             // ✅ Existe  
        'clientes',                  // ✅ Existe
        'pagos',                     // ✅ Existe
        'multas',                    // ✅ Existe
        'gastos_operativos',         // ✅ Existe
        'testimonios',               // ✅ Existe
        'inventario_boutique',       // ✅ Existe (para productos)
        // Tablas opcionales que pueden o no existir:
        'asistencias',
        'adelantos',
        'liquidaciones',
        'ventas_boutique'
      ];
      
      const tablasExistentes: string[] = [];
      for (const tabla of tablasAVerificar) {
        const { error } = await supabase
          .from(tabla)
          .select('id')
          .limit(1);
        
        if (!error) {
          tablasExistentes.push(tabla);
          addLog('success', `✅ Tabla '${tabla}' existe`);
        } else {
          addLog('error', `❌ Tabla '${tabla}' NO existe: ${error.message}`);
        }
      }
      
      if (tablasExistentes.length === 0) {
        throw new Error('No se encontraron tablas en la base de datos. Por favor crea las tablas primero.');
      }

      // 1. Obtener todas las modelos
      setProgreso('Obteniendo modelos...');
      const { data: modelos, error: errorModelos } = await supabase
        .from('usuarios')
        .select('*')
        .eq('role', 'modelo');

      if (errorModelos) throw errorModelos;
      if (!modelos || modelos.length === 0) {
        throw new Error('No hay modelos en la base de datos');
      }

      addLog('success', `✅ Encontradas ${modelos.length} modelos`);

      // 2. Generar clientes (30-50 clientes únicos)
      setProgreso('Generando clientes...');
      const numClientes = 30 + Math.floor(Math.random() * 20);
      const clientes = [];
      
      for (let i = 0; i < numClientes; i++) {
        const cliente = generarCliente();
        clientes.push(cliente);
      }

      addLog('success', `✅ Generados ${clientes.length} clientes únicos`);

      // 3. Generar servicios históricos (200-300 servicios)
      setProgreso('Generando servicios históricos...');
      const numServicios = 200 + Math.floor(Math.random() * 100);
      const servicios = [];
      
      const tiposServicio = ['Sede', 'Domicilio'];
      const tiemposServicio = [
        { nombre: '1 hora', duracion: 60, precioSede: 150000, precioDomicilio: 250000 },
        { nombre: '2 horas', duracion: 120, precioSede: 280000, precioDomicilio: 480000 },
        { nombre: '3 horas', duracion: 180, precioSede: 400000, precioDomicilio: 690000 },
        { nombre: '6 horas', duracion: 360, precioSede: 700000, precioDomicilio: 1200000 },
        { nombre: '8 horas', duracion: 480, precioSede: 900000, precioDomicilio: 1500000 },
        { nombre: '12 horas', duracion: 720, precioSede: 1200000, precioDomicilio: 2000000 },
        { nombre: '24 horas', duracion: 1440, precioSede: 1500000, precioDomicilio: 2500000 }
      ];
      const metodosPago = ['Efectivo', 'QR', 'Nequi', 'Daviplata', 'Datafono'];
      const habitaciones = ['VIP 1', 'VIP 2', 'VIP 3', 'Suite 1', 'Suite 2', 'Presidencial'];

      for (let i = 0; i < numServicios; i++) {
        const modelo = modelos[Math.floor(Math.random() * modelos.length)];
        const cliente = clientes[Math.floor(Math.random() * clientes.length)];
        const tipoServicio = tiposServicio[Math.floor(Math.random() * tiposServicio.length)];
        const tiempoServicio = tiemposServicio[Math.floor(Math.random() * tiemposServicio.length)];
        
        const fechaInicio = generarFechaAleatoria(90);
        const fechaFin = new Date(fechaInicio.getTime() + tiempoServicio.duracion * 60 * 1000);
        
        const costoServicio = tipoServicio === 'Sede' ? tiempoServicio.precioSede : tiempoServicio.precioDomicilio;
        const costoAdicionales = Math.random() > 0.7 ? (50000 + Math.floor(Math.random() * 150000)) : 0;
        const costoConsumo = Math.random() > 0.6 ? (20000 + Math.floor(Math.random() * 80000)) : 0;

        servicios.push({
          modelo_id: modelo.id, // ✅ Usar modelo_id (UUID) en lugar de modelo_email
          servicio: tiempoServicio.nombre,
          duracion: tiempoServicio.duracion, // ✅ Enviar INTEGER (minutos) en lugar de texto
          precio: costoServicio,
          ubicacion: tipoServicio.toLowerCase(),
          fecha: fechaInicio.toISOString(),
          estado: 'finalizado',
          created_at: fechaInicio.toISOString()
        });
      }

      // Insertar servicios (agendamientos) en lotes de 50 usando adminClient
      addLog('info', `📝 Insertando ${servicios.length} agendamientos en la base de datos...`);
      const adminClient = getAdminClient(); // 🔑 Cliente con SERVICE_ROLE_KEY
      const loteSize = 50;
      for (let i = 0; i < servicios.length; i += loteSize) {
        const lote = servicios.slice(i, i + loteSize);
        const { error } = await adminClient // ✅ Usar adminClient para bypassear RLS
          .from('agendamientos')
          .insert(lote);
        
        if (error) {
          addLog('error', `❌ Error insertando lote ${i / loteSize + 1}: ${error.message}`);
        } else {
          addLog('success', `✅ Insertados servicios ${i + 1} a ${Math.min(i + loteSize, servicios.length)}`);
        }
        
        setProgreso(`Insertando servicios: ${Math.min(i + loteSize, servicios.length)}/${servicios.length}`);
      }

      // 4. Generar asistencias (últimos 60 días)
      setProgreso('Generando asistencias...');
      const asistencias = [];
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 60);

      for (let dia = 0; dia < 60; dia++) {
        const fecha = new Date(fechaInicio);
        fecha.setDate(fecha.getDate() + dia);
        
        // No todos los días trabajan todas las modelos
        const modelosDelDia = modelos.filter(() => Math.random() > 0.3);
        
        for (const modelo of modelosDelDia) {
          const entrada = new Date(fecha);
          entrada.setHours(14 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
          
          const salida = new Date(entrada);
          salida.setHours(22 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0);
          
          asistencias.push({
            modelo_id: modelo.id, // ✅ Usar modelo_id (UUID)
            fecha: fecha.toISOString().split('T')[0],
            hora_entrada: entrada.toISOString(),
            hora_salida: salida.toISOString(),
            presente: true
          });
        }
      }

      addLog('info', `📝 Insertando ${asistencias.length} registros de asistencia...`);
      for (let i = 0; i < asistencias.length; i += loteSize) {
        const lote = asistencias.slice(i, i + loteSize);
        const { error } = await supabase
          .from('asistencias')
          .insert(lote);
        
        if (error) {
          addLog('error', `❌ Error insertando asistencias: ${error.message}`);
        }
      }
      addLog('success', `✅ Insertadas ${asistencias.length} asistencias`);

      // 5. Generar adelantos (algunos pendientes, algunos pagados)
      setProgreso('Generando adelantos...');
      const adelantos = [];
      
      for (const modelo of modelos) {
        // 2-5 adelantos por modelo
        const numAdelantos = 2 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < numAdelantos; i++) {
          const monto = [50000, 100000, 150000, 200000, 300000][Math.floor(Math.random() * 5)];
          const fecha = generarFechaAleatoria(45);
          const pagado = Math.random() > 0.3; // 70% pagados
          
          adelantos.push({
            modelo_id: modelo.id, // ✅ Usar modelo_id (UUID)
            monto,
            fecha_adelanto: fecha.toISOString(),
            estado: pagado ? 'pagado' : 'pendiente',
            fecha_pago: pagado ? generarFechaAleatoria(15).toISOString() : null,
            notas: `Adelanto solicitado el ${fecha.toLocaleDateString()}`
          });
        }
      }

      addLog('info', `📝 Insertando ${adelantos.length} adelantos...`);
      const { error: errorAdelantos } = await supabase
        .from('adelantos')
        .insert(adelantos);
      
      if (errorAdelantos) {
        addLog('error', `❌ Error insertando adelantos: ${errorAdelantos.message}`);
      } else {
        addLog('success', `✅ Insertados ${adelantos.length} adelantos`);
      }

      // 6. Generar liquidaciones (últimos 3 meses)
      setProgreso('Generando liquidaciones...');
      const liquidaciones = [];
      
      for (let mes = 0; mes < 3; mes++) {
        for (const modelo of modelos) {
          const fecha = new Date();
          fecha.setMonth(fecha.getMonth() - mes);
          fecha.setDate(5); // Liquidación el día 5 de cada mes
          
          const totalServicios = 500000 + Math.floor(Math.random() * 2000000);
          const totalAdicionales = Math.floor(Math.random() * 300000);
          const totalConsumos = Math.floor(Math.random() * 200000);
          const adelantosDescontados = Math.floor(Math.random() * 400000);
          const multas = Math.random() > 0.8 ? Math.floor(Math.random() * 100000) : 0;
          
          const total = totalServicios + totalAdicionales - adelantosDescontados - multas;
          
          liquidaciones.push({
            modelo_id: modelo.id, // ✅ Usar modelo_id (UUID)
            periodo_inicio: new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString(),
            periodo_fin: new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toISOString(),
            fecha_liquidacion: fecha.toISOString(),
            total_servicios: totalServicios,
            total_adicionales: totalAdicionales,
            total_consumos: totalConsumos,
            adelantos_descontados: adelantosDescontados,
            multas,
            total,
            estado: 'pagada',
            metodo_pago: metodosPago[Math.floor(Math.random() * metodosPago.length)]
          });
        }
      }

      addLog('info', `📝 Insertando ${liquidaciones.length} liquidaciones...`);
      const { error: errorLiquidaciones } = await supabase
        .from('liquidaciones')
        .insert(liquidaciones);
      
      if (errorLiquidaciones) {
        addLog('error', `❌ Error insertando liquidaciones: ${errorLiquidaciones.message}`);
      } else {
        addLog('success', `✅ Insertadas ${liquidaciones.length} liquidaciones`);
      }

      // 7. Generar productos de boutique vendidos
      setProgreso('Generando ventas de boutique...');
      
      // Primero obtener productos existentes
      const { data: productos, error: errorProductos } = await supabase
        .from('inventario_boutique')
        .select('*');
      
      if (!errorProductos && productos && productos.length > 0) {
        const ventas = [];
        
        for (let i = 0; i < 50; i++) {
          const producto = productos[Math.floor(Math.random() * productos.length)];
          const fecha = generarFechaAleatoria(60);
          const cantidad = 1 + Math.floor(Math.random() * 3);
          const precioUnitario = producto.precio || 50000; // ✅ Usar campo 'precio' con fallback
          
          ventas.push({
            producto_id: producto.id,
            producto_nombre: producto.nombre,
            cantidad,
            precio_unitario: precioUnitario, // ✅ Usar variable con valor garantizado
            total: cantidad * precioUnitario,
            fecha: fecha.toISOString(),
            metodo_pago: metodosPago[Math.floor(Math.random() * metodosPago.length)]
          });
        }
        
        addLog('info', `📝 Insertando ${ventas.length} ventas de boutique...`);
        const { error: errorVentas } = await supabase
          .from('ventas_boutique')
          .insert(ventas);
        
        if (errorVentas) {
          addLog('error', `❌ Error insertando ventas: ${errorVentas.message}`);
        } else {
          addLog('success', `✅ Insertadas ${ventas.length} ventas de boutique`);
        }
      }

      // 8. Generar gastos operativos
      setProgreso('Generando gastos operativos...');
      const gastos = [];
      const categoriasGasto = [
        { categoria: 'Servicios Públicos', conceptos: ['Luz', 'Agua', 'Internet', 'Gas'] },
        { categoria: 'Mantenimiento', conceptos: ['Limpieza', 'Reparaciones', 'Jardinería'] },
        { categoria: 'Insumos', conceptos: ['Toallas', 'Sábanas', 'Productos de limpieza', 'Amenities'] },
        { categoria: 'Publicidad', conceptos: ['Redes sociales', 'Pauta digital', 'Fotografía'] },
        { categoria: 'Administrativo', conceptos: ['Papelería', 'Software', 'Contabilidad'] }
      ];
      
      for (let mes = 0; mes < 3; mes++) {
        for (const cat of categoriasGasto) {
          const numGastos = 1 + Math.floor(Math.random() * 3);
          
          for (let i = 0; i < numGastos; i++) {
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() - mes);
            fecha.setDate(1 + Math.floor(Math.random() * 28));
            
            const concepto = cat.conceptos[Math.floor(Math.random() * cat.conceptos.length)];
            const monto = 50000 + Math.floor(Math.random() * 500000);
            
            gastos.push({
              fecha: fecha.toISOString(),
              categoria: cat.categoria,
              concepto,
              monto,
              metodo_pago: metodosPago[Math.floor(Math.random() * metodosPago.length)],
              notas: `Gasto de ${concepto} - ${cat.categoria}`
            });
          }
        }
      }
      
      addLog('info', `📝 Insertando ${gastos.length} gastos operativos...`);
      const { error: errorGastos } = await supabase
        .from('gastos_operativos')
        .insert(gastos);
      
      if (errorGastos) {
        addLog('error', `❌ Error insertando gastos: ${errorGastos.message}`);
      } else {
        addLog('success', `✅ Insertados ${gastos.length} gastos operativos`);
      }

      // 9. Actualizar estadísticas de modelos
      setProgreso('Actualizando estadísticas de modelos...');
      
      for (const modelo of modelos) {
        // Contar servicios y calcular ingresos desde agendamientos
        const { data: serviciosModelo } = await supabase
          .from('agendamientos')
          .select('precio')
          .eq('modelo_id', modelo.id) // ✅ Usar modelo_id (UUID)
          .eq('estado', 'finalizado');
        
        if (serviciosModelo) {
          const totalServicios = serviciosModelo.length;
          const totalIngresos = serviciosModelo.reduce((sum, s) => 
            sum + (s.precio || 0), 0
          );
          
          // Actualizar en BD (solo si los campos existen)
          await supabase
            .from('usuarios')
            .update({
              servicios: totalServicios,
              ingresos: totalIngresos
            })
            .eq('email', modelo.email);
          
          addLog('success', `✅ ${modelo.nombreArtistico || modelo.nombre}: ${totalServicios} servicios, $${(totalIngresos / 1000000).toFixed(1)}M`);
        }
      }

      setProgreso('¡Completado!');
      setCompletado(true);
      addLog('success', '🎉 Datos demo generados exitosamente!');
      toast.success('¡Datos demo generados exitosamente!', {
        description: `Se generaron ${servicios.length} servicios, ${clientes.length} clientes, ${asistencias.length} asistencias y más.`
      });

    } catch (error: any) {
      addLog('error', `❌ Error: ${error.message}`);
      toast.error('Error generando datos demo', {
        description: error.message
      });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Generador de Datos Demo
            </CardTitle>
            <CardDescription>
              Genera datos de prueba realistas para probar todas las funcionalidades del sistema
            </CardDescription>
          </div>
          {completado && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle className="w-4 h-4 mr-1" />
              Completado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información sobre qué se generará */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-secondary p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Servicios</p>
            </div>
            <p className="text-lg font-bold">200-300</p>
          </div>
          
          <div className="bg-secondary p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Clientes</p>
            </div>
            <p className="text-lg font-bold">30-50</p>
          </div>
          
          <div className="bg-secondary p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Asistencias</p>
            </div>
            <p className="text-lg font-bold">60 días</p>
          </div>
          
          <div className="bg-secondary p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Finanzas</p>
            </div>
            <p className="text-lg font-bold">3 meses</p>
          </div>
        </div>

        {/* Progreso */}
        {generando && progreso && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-sm font-medium">{progreso}</p>
            </div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs space-y-1">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-2 ${
                  log.tipo === 'error' ? 'text-red-400' :
                  log.tipo === 'success' ? 'text-green-400' :
                  'text-blue-400'
                }`}
              >
                <span className="text-muted-foreground">
                  [{log.timestamp.toLocaleTimeString()}]
                </span>
                <span className="flex-1">{log.mensaje}</span>
              </div>
            ))}
          </div>
        )}

        {/* Botón de acción */}
        <Button
          onClick={generarDatosDemo}
          disabled={generando}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          {generando ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando datos...
            </>
          ) : completado ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Generar nuevamente
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Generar Datos Demo
            </>
          )}
        </Button>

        {/* Advertencia */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-200">
            <p className="font-medium mb-1">⚠️ Advertencia</p>
            <p>
              Esto generará datos de prueba realistas en la base de datos. 
              Los datos pueden ser limpiados posteriormente cuando las modelos empiecen a usar el sistema.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}