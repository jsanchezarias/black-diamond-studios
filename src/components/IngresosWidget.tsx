import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase/info'

interface IngresosWidgetProps {
  rol: string;
  modeloEmail?: string | null;
  mostrarDetalle?: boolean;
}

const IngresosWidget = ({
  rol,
  modeloEmail = null,
  mostrarDetalle = false
}: IngresosWidgetProps) => {
  const [data, setData] = useState({
    hoy: 0,
    semana: 0,
    mes: 0,
    pendientes: 0,
    completados: 0
  })
  const [loading, setLoading] = useState(true)

  const cargarIngresos = async () => {
    const hoy = new Date().toISOString().split('T')[0]
    const inicioSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    let query = supabase
      .from('agendamientos')
      .select('precio, monto_pago, estado, estado_pago, fecha, modelo_email')
      .eq('estado', 'completado')

    if (rol === 'modelo' && modeloEmail) {
      query = query.eq('modelo_email', modeloEmail)
    }

    const { data: agendamientos } = await query

    const calcular = (items: any[] | null, desde: string) => items
      ?.filter(a => a.fecha?.split('T')[0] >= desde)
      ?.reduce((sum, a) => sum + (parseFloat(a.monto_pago || a.precio) || 0), 0) || 0

    setData({
      hoy: calcular(agendamientos, hoy),
      semana: calcular(agendamientos, inicioSemana),
      mes: calcular(agendamientos, inicioMes),
      pendientes: agendamientos?.filter(a => a.estado_pago !== 'pagado').length || 0,
      completados: agendamientos?.length || 0
    })
    setLoading(false)
  }

  useEffect(() => {
    cargarIngresos()

    const channel = supabase
      .channel('ingresos-' + rol + '-' + (modeloEmail || 'all'))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'agendamientos'
      }, () => cargarIngresos())
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agendamientos'
      }, () => cargarIngresos())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [rol, modeloEmail])

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-CO')

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.5)', padding: 16 }}>Cargando ingresos...</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
      <div style={{ background: 'rgba(76,175,80,0.1)', border: '0.5px solid rgba(76,175,80,0.3)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>HOY</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#4CAF50' }}>{fmt(data.hoy)}</div>
      </div>
      <div style={{ background: 'rgba(33,150,243,0.1)', border: '0.5px solid rgba(33,150,243,0.3)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>ESTA SEMANA</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#2196F3' }}>{fmt(data.semana)}</div>
      </div>
      <div style={{ background: 'rgba(255,215,0,0.1)', border: '0.5px solid rgba(255,215,0,0.3)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>ESTE MES</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#FFD700' }}>{fmt(data.mes)}</div>
      </div>
      <div style={{ background: 'rgba(255,165,0,0.1)', border: '0.5px solid rgba(255,165,0,0.3)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>SERVICIOS</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#FFA500' }}>{data.completados}</div>
      </div>
    </div>
  )
}

export default IngresosWidget
