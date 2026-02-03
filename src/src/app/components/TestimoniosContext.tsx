import { createContext, useContext, useState, ReactNode } from 'react';

export interface Testimonio {
  id: string;
  nombre: string;
  email: string;
  comentario: string;
  calificacion: number;
  fecha: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  respuestaAdmin?: string;
}

interface TestimoniosContextType {
  testimonios: Testimonio[];
  agregarTestimonio: (testimonio: Omit<Testimonio, 'id' | 'fecha' | 'estado'>) => void;
  aprobarTestimonio: (id: string, respuesta?: string) => void;
  rechazarTestimonio: (id: string) => void;
  eliminarTestimonio: (id: string) => void;
  getTestimoniosAprobados: () => Testimonio[];
  getTestimoniosPendientes: () => Testimonio[];
}

const TestimoniosContext = createContext<TestimoniosContextType | undefined>(undefined);

// ✅ TESTIMONIOS DEMO - Experiencias reales de clientes
const testimoniosIniciales: Testimonio[] = [
  {
    id: '1',
    nombre: 'Ricardo M.',
    email: 'ricardo.m@executive.com',
    comentario: 'Visité Black Diamond por primera vez y quedé impresionado. La ubicación es excelente, en un barrio muy seguro y tranquilo. Las habitaciones son cómodas, impecables y muy bien decoradas. Reservé con Isabella y superó todas mis expectativas: conversación inteligente, trato refinado y una conexión auténtica. El servicio de valet parking es un detalle que marca la diferencia. Sin duda volveré.',
    calificacion: 5,
    fecha: '2026-01-28',
    estado: 'aprobado',
    respuestaAdmin: 'Muchas gracias Ricardo por tu confianza. Isabella es una de nuestras modelos más solicitadas y nos alegra que hayas disfrutado de nuestras instalaciones premium. Te esperamos pronto. 💎'
  },
  {
    id: '2',
    nombre: 'Alejandro T.',
    email: 'a.torres@business.co',
    comentario: 'Experiencia excepcional con Annie. Desde la recepción hasta el momento de la despedida, todo fue perfecto. Las habitaciones son súper limpias y cómodas, con iluminación ambiental y máxima privacidad. Annie es encantadora, profesional y tiene una energía contagiosa. La boutique con servicio a la habitación 24/7 es un plus increíble. Relación calidad-precio excelente.',
    calificacion: 5,
    fecha: '2026-01-26',
    estado: 'aprobado',
    respuestaAdmin: 'Gracias Alejandro. Annie agradece tus palabras y se alegra de haberte brindado una experiencia memorable. Nuestro compromiso es ofrecer siempre el mejor servicio. ¡Nos vemos pronto! ✨'
  },
  {
    id: '3',
    nombre: 'Carlos E.',
    email: 'c.estrada@mail.com',
    comentario: 'Llevo varios meses visitando Black Diamond y es mi lugar favorito. He tenido la oportunidad de conocer a Luci y Natalia, ambas increíbles. Lo que más valoro es la discreción total, la limpieza impecable y el ambiente relajado pero sofisticado. El barrio es muy seguro, nunca he tenido problemas. El valet parking te quita cualquier preocupación. Todo está pensado para tu comodidad.',
    calificacion: 5,
    fecha: '2026-01-24',
    estado: 'aprobado',
    respuestaAdmin: 'Carlos, es un placer contar contigo como cliente frecuente. Luci y Natalia envían saludos especiales. Gracias por confiar en nosotros mes a mes. Tu satisfacción es nuestra prioridad. 🥂'
  },
  {
    id: '4',
    nombre: 'Miguel A.',
    email: 'miguel.a@consulting.com',
    comentario: 'Primera vez que uso este tipo de servicios y Black Diamond hizo que todo fuera fácil y cómodo. Reservé con Isabella para un encuentro de 2 horas. Las instalaciones son espectaculares: habitaciones cómodas con ducha privada, todo muy limpio. Isabella es dulce, paciente y muy profesional. Me hizo sentir completamente relajado. La ubicación es perfecta y el barrio transmite mucha seguridad. Definitivamente recomendado.',
    calificacion: 5,
    fecha: '2026-01-22',
    estado: 'aprobado',
    respuestaAdmin: 'Miguel, nos emociona saber que tu primera experiencia fue tan positiva. Isabella tiene ese don especial de hacer sentir cómodos a todos. Gracias por elegirnos y por tu recomendación. 🌟'
  },
  {
    id: '5',
    nombre: 'Eduardo V.',
    email: 'e.valencia@pro.com',
    comentario: 'He probado varios lugares en la ciudad y Black Diamond está en otro nivel. La atención al cliente es impecable desde que haces la reserva por Telegram. Conocí a Annie y Natalia en diferentes ocasiones, ambas excelentes. Las habitaciones son súper cómodas y limpias, la boutique tiene de todo con servicio 24/7 directo a tu habitación. El valet parking es súper útil. La zona es segura y discreta. Vale cada peso.',
    calificacion: 5,
    fecha: '2026-01-20',
    estado: 'aprobado',
    respuestaAdmin: 'Eduardo, agradecemos tu fidelidad y tus palabras. Trabajamos cada día para mantener nuestros estándares de excelencia. Annie y Natalia te mandan un saludo especial. ¡Hasta pronto! 💎'
  }
];

export function TestimoniosProvider({ children }: { children: ReactNode }) {
  const [testimonios, setTestimonios] = useState<Testimonio[]>(testimoniosIniciales);

  const agregarTestimonio = (nuevoTestimonio: Omit<Testimonio, 'id' | 'fecha' | 'estado'>) => {
    const testimonio: Testimonio = {
      ...nuevoTestimonio,
      id: Date.now().toString(),
      fecha: new Date().toISOString().split('T')[0],
      estado: 'pendiente'
    };
    setTestimonios([...testimonios, testimonio]);
  };

  const aprobarTestimonio = (id: string, respuesta?: string) => {
    setTestimonios(testimonios.map(t => 
      t.id === id 
        ? { ...t, estado: 'aprobado' as const, respuestaAdmin: respuesta } 
        : t
    ));
  };

  const rechazarTestimonio = (id: string) => {
    setTestimonios(testimonios.map(t => 
      t.id === id 
        ? { ...t, estado: 'rechazado' as const } 
        : t
    ));
  };

  const eliminarTestimonio = (id: string) => {
    setTestimonios(testimonios.filter(t => t.id !== id));
  };

  const getTestimoniosAprobados = () => {
    return testimonios.filter(t => t.estado === 'aprobado').sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  };

  const getTestimoniosPendientes = () => {
    return testimonios.filter(t => t.estado === 'pendiente').sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  };

  return (
    <TestimoniosContext.Provider value={{
      testimonios,
      agregarTestimonio,
      aprobarTestimonio,
      rechazarTestimonio,
      eliminarTestimonio,
      getTestimoniosAprobados,
      getTestimoniosPendientes
    }}>
      {children}
    </TestimoniosContext.Provider>
  );
}

export function useTestimonios() {
  const context = useContext(TestimoniosContext);
  if (context === undefined) {
    throw new Error('useTestimonios debe ser usado dentro de TestimoniosProvider');
  }
  return context;
}