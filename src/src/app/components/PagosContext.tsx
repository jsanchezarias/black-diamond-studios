import { createContext, useContext, useState, ReactNode } from 'react';
import { 
  notificarPagoRecibido,
  notificarAdelantoAprobado,
  notificarAdelantoRechazado
} from './NotificacionesHelpers';

export interface Adelanto {
  id: string;
  modeloEmail: string;
  modeloNombre: string;
  monto: number;
  fechaSolicitud: Date;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fechaRespuesta?: Date;
  aprobadoPor?: string;
  motivo?: string;
}

export interface Pago {
  id: string;
  modeloEmail: string;
  modeloNombre: string;
  monto: number;
  fecha: Date;
  periodo: {
    inicio: Date;
    fin: Date;
  };
  detalles: {
    servicios: number;
    adicionales: number;
    consumoDuranteServicio: number;
    comprasFueraServicio: number;
    multas: number;
    adelantos: number;
    subtotal: number;
    total: number;
  };
  realizadoPor: string;
  metodoPago: string;
  notas?: string;
}

export interface LiquidacionDetalle {
  modeloEmail: string;
  modeloNombre: string;
  servicios: {
    cantidad: number;
    valorTotal: number;
    porcentaje: number;
    liquidacion: number;
  };
  adicionales: {
    cantidad: number;
    valorTotal: number;
    porcentaje: number;
    liquidacion: number;
  };
  consumoDuranteServicio: {
    cantidad: number;
    valorTotal: number;
    porcentaje: number;
    liquidacion: number;
  };
  comprasFueraServicio: {
    cantidad: number;
    valorTotal: number;
  };
  multas: {
    cantidad: number;
    valorTotal: number;
  };
  adelantos: {
    cantidad: number;
    valorTotal: number;
  };
  subtotal: number;
  deducciones: number;
  totalAPagar: number;
  ultimoPago?: Date;
}

interface PagosContextType {
  adelantos: Adelanto[];
  pagos: Pago[];
  solicitarAdelanto: (modeloEmail: string, modeloNombre: string, monto: number, motivo?: string) => void;
  aprobarAdelanto: (adelantoId: string, aprobadoPor: string) => void;
  rechazarAdelanto: (adelantoId: string, aprobadoPor: string) => void;
  registrarPago: (
    modeloEmail: string,
    modeloNombre: string,
    detalles: LiquidacionDetalle,
    realizadoPor: string,
    metodoPago: string,
    notas?: string
  ) => void;
  obtenerAdelantosModelo: (modeloEmail: string) => Adelanto[];
  obtenerAdelantosPendientes: () => Adelanto[];
  obtenerPagosModelo: (modeloEmail: string) => Pago[];
  obtenerTotalAdelantosAprobados: (modeloEmail: string) => number;
  obtenerHistorialPagos: () => Pago[];
  obtenerUltimoPagoModelo: (modeloEmail: string) => Pago | null;
  obtenerFechaUltimoPago: (modeloEmail: string) => Date | null;
}

const PagosContext = createContext<PagosContextType | undefined>(undefined);

export function PagosProvider({ children }: { children: ReactNode }) {
  // ✅ SIN DATOS DEMO - Sistema listo para producción
  const [adelantos, setAdelantos] = useState<Adelanto[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);

  const solicitarAdelanto = (
    modeloEmail: string,
    modeloNombre: string,
    monto: number,
    motivo?: string
  ) => {
    const nuevoAdelanto: Adelanto = {
      id: Date.now().toString(),
      modeloEmail,
      modeloNombre,
      monto,
      fechaSolicitud: new Date(),
      estado: 'pendiente',
      motivo,
    };

    setAdelantos([...adelantos, nuevoAdelanto]);
  };

  const aprobarAdelanto = (adelantoId: string, aprobadoPor: string) => {
    const adelanto = adelantos.find(a => a.id === adelantoId);
    
    setAdelantos(
      adelantos.map((a) =>
        a.id === adelantoId
          ? {
              ...a,
              estado: 'aprobado' as const,
              fechaRespuesta: new Date(),
              aprobadoPor,
            }
          : a
      )
    );

    // 🔔 NOTIFICACIÓN: Adelanto aprobado
    if (adelanto) {
      const fechaPago = new Date();
      fechaPago.setDate(fechaPago.getDate() + 1); // Ejemplo: pago al día siguiente
      
      notificarAdelantoAprobado({
        modeloEmail: adelanto.modeloEmail,
        monto: adelanto.monto,
        fechaPago: fechaPago.toLocaleDateString('es-CO')
      }).catch(err => console.error('Error notificando adelanto aprobado:', err));
    }
  };

  const rechazarAdelanto = (adelantoId: string, aprobadoPor: string) => {
    const adelanto = adelantos.find(a => a.id === adelantoId);
    
    setAdelantos(
      adelantos.map((a) =>
        a.id === adelantoId
          ? {
              ...a,
              estado: 'rechazado' as const,
              fechaRespuesta: new Date(),
              aprobadoPor,
            }
          : a
      )
    );

    // 🔔 NOTIFICACIÓN: Adelanto rechazado
    if (adelanto) {
      notificarAdelantoRechazado({
        modeloEmail: adelanto.modeloEmail,
        monto: adelanto.monto,
        motivo: 'Solicitud denegada por administración'
      }).catch(err => console.error('Error notificando adelanto rechazado:', err));
    }
  };

  const registrarPago = (
    modeloEmail: string,
    modeloNombre: string,
    detalles: LiquidacionDetalle,
    realizadoPor: string,
    metodoPago: string,
    notas?: string
  ) => {
    const nuevoPago: Pago = {
      id: Date.now().toString(),
      modeloEmail,
      modeloNombre,
      monto: detalles.totalAPagar,
      fecha: new Date(),
      periodo: {
        inicio: detalles.ultimoPago || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        fin: new Date(),
      },
      detalles: {
        servicios: detalles.servicios.liquidacion,
        adicionales: detalles.adicionales.liquidacion,
        consumoDuranteServicio: detalles.consumoDuranteServicio.liquidacion,
        comprasFueraServicio: detalles.comprasFueraServicio.valorTotal,
        multas: detalles.multas.valorTotal,
        adelantos: detalles.adelantos.valorTotal,
        subtotal: detalles.subtotal,
        total: detalles.totalAPagar,
      },
      realizadoPor,
      metodoPago,
      notas,
    };

    setPagos([nuevoPago, ...pagos]);

    // 🔔 NOTIFICACIÓN: Pago recibido
    notificarPagoRecibido({
      modeloEmail,
      monto: detalles.totalAPagar,
      concepto: 'Liquidación de servicios',
      metodoPago
    }).catch(err => console.error('Error notificando pago recibido:', err));
  };

  const obtenerAdelantosModelo = (modeloEmail: string) => {
    return adelantos.filter((adelanto) => adelanto.modeloEmail === modeloEmail);
  };

  const obtenerAdelantosPendientes = () => {
    return adelantos.filter((adelanto) => adelanto.estado === 'pendiente');
  };

  const obtenerPagosModelo = (modeloEmail: string) => {
    return pagos.filter((pago) => pago.modeloEmail === modeloEmail);
  };

  const obtenerTotalAdelantosAprobados = (modeloEmail: string) => {
    // Obtener el último pago de la modelo
    const pagosModelo = obtenerPagosModelo(modeloEmail);
    const ultimoPago = pagosModelo.length > 0 ? pagosModelo[0].fecha : null;

    // Sumar adelantos aprobados desde el último pago
    return adelantos
      .filter(
        (adelanto) =>
          adelanto.modeloEmail === modeloEmail &&
          adelanto.estado === 'aprobado' &&
          (!ultimoPago || adelanto.fechaRespuesta! > ultimoPago)
      )
      .reduce((total, adelanto) => total + adelanto.monto, 0);
  };

  const obtenerHistorialPagos = () => {
    return pagos;
  };

  const obtenerUltimoPagoModelo = (modeloEmail: string): Pago | null => {
    const pagosModelo = obtenerPagosModelo(modeloEmail);
    return pagosModelo.length > 0 ? pagosModelo[0] : null;
  };

  const obtenerFechaUltimoPago = (modeloEmail: string): Date | null => {
    const ultimoPago = obtenerUltimoPagoModelo(modeloEmail);
    return ultimoPago ? ultimoPago.fecha : null;
  };

  return (
    <PagosContext.Provider
      value={{
        adelantos,
        pagos,
        solicitarAdelanto,
        aprobarAdelanto,
        rechazarAdelanto,
        registrarPago,
        obtenerAdelantosModelo,
        obtenerAdelantosPendientes,
        obtenerPagosModelo,
        obtenerTotalAdelantosAprobados,
        obtenerHistorialPagos,
        obtenerUltimoPagoModelo,
        obtenerFechaUltimoPago,
      }}
    >
      {children}
    </PagosContext.Provider>
  );
}

export function usePagos() {
  const context = useContext(PagosContext);
  if (context === undefined) {
    throw new Error('usePagos debe usarse dentro de un PagosProvider');
  }
  return context;
}