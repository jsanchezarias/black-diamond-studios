// Interfaz Sede (definida aquí para independencia del archivo)
export interface Sede {
  id: string;
  name: string;
  location: string;
  streamUrl: string;
  modelosDisponibles: number;
  isLive: boolean;
  description: string;
}

export interface Model {
  id: string;
  name: string;
  age: number;
  photo: string;
  gallery: string[];
  rating: number;
  height: string;
  measurements: string;
  languages: string[];
  location: string;
  available: boolean;
  sedeId: string; // Nueva propiedad para asociar modelo con sede
  description: string;
  services: Array<{
    name: string;
    duration: string;
    price: string;
    priceHome?: string;
    description: string;
  }>;
  specialties: string[];
}

export const sedes: Sede[] = [
  {
    id: 'sede-1',
    name: 'Sede Zona Norte',
    location: 'Zona Norte Premium',
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    modelosDisponibles: 1,
    isLive: true,
    description: 'Nuestra sede principal con las mejores instalaciones VIP y modelos Elite.'
  },
  // 🚧 SEDES EN DESARROLLO - Próximamente disponibles
  /* 
  {
    id: 'sede-2',
    name: 'Sede Centro',
    location: 'Zona Centro Ejecutiva',
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    modelosDisponibles: 2,
    isLive: true,
    description: 'Ubicación estratégica ideal para encuentros ejecutivos y citas de negocios.'
  },
  {
    id: 'sede-3',
    name: 'Sede Zona Rosa',
    location: 'Distrito de Lujo',
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    modelosDisponibles: 2,
    isLive: true,
    description: 'Ambiente sofisticado en el corazón de la zona de entretenimiento premium.'
  },
  {
    id: 'sede-4',
    name: 'Sede Elite Spa',
    location: 'Zona Wellness',
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    modelosDisponibles: 2,
    isLive: true,
    description: 'Experiencias de relajación total con spa de lujo y suites premium.'
  },
  {
    id: 'sede-5',
    name: 'Sede Penthouse',
    location: 'Zona Exclusiva VIP',
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    modelosDisponibles: 1,
    isLive: true,
    description: 'Máximo lujo y privacidad. Experiencias únicas en nuestro penthouse exclusivo.'
  },
  */
];

export const allModels: Model[] = [
  // ⭐ PERFIL REAL - ANNIE (Sede Norte)
  {
    id: 'annie-001',
    name: 'Annie',
    age: 21,
    photo: 'https://lh3.googleusercontent.com/d/1qYdBfWfotlCxuJKD4TXTp3aHotIJ9Ep1',
    gallery: [
      'https://lh3.googleusercontent.com/d/1qYdBfWfotlCxuJKD4TXTp3aHotIJ9Ep1',
      'https://lh3.googleusercontent.com/d/16D6qOymlckS5rtccdc7IeDYKBkYFzAQF',
      'https://lh3.googleusercontent.com/d/11junC_y6lS_m47E9ZxGCRQ5tNxDwZB17',
      'https://lh3.googleusercontent.com/d/1n4SuCIxkCwIGpJlYlsyIaebFnltkVL4P',
      'https://lh3.googleusercontent.com/d/1hehY0KO3yk_mxts5yg6Yp9Xc6F80TEI3',
      'https://lh3.googleusercontent.com/d/19GKxQUtUQJ8xtl6XM6WTke1zdFnFsmdt',
      'https://lh3.googleusercontent.com/d/1X07C9pEUMuIKSLvdeLfc9TfBjpi-uTgQ',
      'https://lh3.googleusercontent.com/d/1YXBrLxWImMapvI8CIbxKDoqPYpKEA93h',
      'https://lh3.googleusercontent.com/d/1WgTtV_YWVHSVwD_iZZA8w-P_xuswXQnb',
      'https://lh3.googleusercontent.com/d/1U7j-jnbz7USdYOWSeJhcbR5nx7XoahX0',
      'https://lh3.googleusercontent.com/d/1_fhcC5bZFv7RQA00SjhqlswGUFcLwKs7',
      'https://lh3.googleusercontent.com/d/1_tv7acKOYcsdd3ufJUbc8toi645aiH5l',
      'https://lh3.googleusercontent.com/d/170pFPNeRVsNru5F-hHk8OYE0fnCyzpF0'
    ],
    rating: 4.9,
    height: '165 cm',
    measurements: '90-65-96',
    languages: ['Español', 'Inglés'],
    location: 'Sede Norte',
    available: true,
    sedeId: 'sede-1',
    description: 'Belleza colombo-venezolana con una mezcla única de elegancia y pasión. Annie combina experiencia, carisma y una conexión auténtica que transforma cada encuentro en una experiencia inolvidable.',
    services: [
      {
        name: '1 Hora',
        duration: '1 hora',
        price: '200.000',
        priceHome: '250.000',
        description: 'Encuentro íntimo y exclusivo'
      },
      {
        name: '2 Horas',
        duration: '2 horas',
        price: '380.000',
        priceHome: '480.000',
        description: 'Experiencia extendida sin apuros'
      },
      {
        name: 'Amanecida 6 Horas',
        duration: '6 horas',
        price: '1.000.000',
        priceHome: '1.200.000',
        description: 'Noche de lujo y placer'
      },
      {
        name: 'Amanecida 8 Horas',
        duration: '8 horas',
        price: '1.300.000',
        priceHome: '1.500.000',
        description: 'Experiencia nocturna extendida'
      },
      {
        name: 'Amanecida 12 Horas',
        duration: '12 horas',
        price: '1.600.000',
        priceHome: '1.800.000',
        description: 'Media jornada de placer absoluto'
      },
      {
        name: '24 Horas',
        duration: '24 horas',
        price: '2.000.000',
        priceHome: '2.400.000',
        description: 'Día completo de experiencia VIP exclusiva'
      }
    ],
    specialties: [
      'Baile erótico',
      'Masajes',
      'Flexibilidad',
      'Trato de novios',
      'Experiencia VIP'
    ]
  },

  // ⭐ PERFIL REAL - LUCI (Sede Norte)
  {
    id: 'luci-002',
    name: 'Luci',
    age: 21,
    photo: 'https://lh3.googleusercontent.com/d/1b1P4V-apOjcNgqE_MgqO_2Q2o6dTCy2B',
    gallery: [
      'https://lh3.googleusercontent.com/d/1b1P4V-apOjcNgqE_MgqO_2Q2o6dTCy2B',
      'https://lh3.googleusercontent.com/d/1mE05TwSBhv2WSyvZ8FZ6EXHO8u9Z1OEQ',
      'https://lh3.googleusercontent.com/d/1ZT7mQLbE5RrWQluv3Ba55dJO6Gg_BSCY',
      'https://lh3.googleusercontent.com/d/1MXoSJMygn-NxE8hvsckaIJ08tWj-FV0D',
      'https://lh3.googleusercontent.com/d/1IcTOObazXz3FNf9vbsRYnqO3MsJlHvSu',
      'https://lh3.googleusercontent.com/d/1zwtKmiT_G_qaMj38iy72heA25oabVEFU'
    ],
    rating: 4.9,
    height: '150 cm',
    measurements: '85-58-87',
    languages: ['Español'],
    location: 'Sede Norte',
    available: true,
    sedeId: 'sede-1',
    description: 'Joven y radiante, Luci destaca por su estética petite, rasgos delicados y una armonía natural que transmite frescura y ternura. Atlética, ágil y entregada, combina una energía alegre con una presencia cuidada y segura en cada detalle. Su silueta equilibrada —cintura definida y curvas firmes— junto a su actitud luminosa, hacen de Luci una experiencia refinada y memorable.',
    services: [
      {
        name: '1 Hora',
        duration: '1 hora',
        price: '160.000',
        priceHome: '250.000',
        description: 'Encuentro íntimo y exclusivo'
      },
      {
        name: '2 Horas',
        duration: '2 horas',
        price: '300.000',
        priceHome: '480.000',
        description: 'Experiencia extendida sin apuros'
      },
      {
        name: 'Amanecida 6 Horas',
        duration: '6 horas',
        price: '800.000',
        priceHome: '1.200.000',
        description: 'Noche de lujo y placer'
      },
      {
        name: 'Amanecida 8 Horas',
        duration: '8 horas',
        price: '1.100.000',
        priceHome: '1.500.000',
        description: 'Experiencia nocturna extendida'
      },
      {
        name: 'Amanecida 12 Horas',
        duration: '12 horas',
        price: '1.500.000',
        priceHome: '1.800.000',
        description: 'Media jornada de placer absoluto'
      },
      {
        name: '24 Horas',
        duration: '24 horas',
        price: '1.900.000',
        priceHome: '2.400.000',
        description: 'Día completo de experiencia VIP exclusiva'
      }
    ],
    specialties: [
      'Baile erótico',
      'Masajes',
      'Flexibilidad',
      'Trato de novios',
      'Experiencia VIP'
    ]
  },

  // ⭐ PERFIL REAL - ISABELLA (Sede Norte)
  {
    id: 'isabella-003',
    name: 'Isabella',
    age: 21,
    photo: 'https://lh3.googleusercontent.com/d/1Wg94Vmh9nrYE60NNrA6-QHTxldsFhkLk',
    gallery: [
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
    ],
    rating: 5.0,
    height: '170 cm',
    measurements: '90-63-94',
    languages: ['Español'],
    location: 'Sede Norte',
    available: true,
    sedeId: 'sede-1',
    description: 'Alta y de belleza delicada, Isabella cautiva con un rostro femenino y armonioso, piel clara y una presencia elegante que recuerda la sutileza de una muñeca. Alegre, educada y excelente conversadora, combina su formación académica con una actitud cercana y refinada. Su silueta voluptuosa y equilibrada, realzada por una postura segura y curvas definidas, completa una experiencia distinguida y memorable.',
    services: [
      {
        name: '1 Hora',
        duration: '1 hora',
        price: '190.000',
        priceHome: '250.000',
        description: 'Encuentro íntimo y exclusivo'
      },
      {
        name: '2 Horas',
        duration: '2 horas',
        price: '360.000',
        priceHome: '480.000',
        description: 'Experiencia extendida sin apuros'
      },
      {
        name: 'Amanecida 6 Horas',
        duration: '6 horas',
        price: '950.000',
        priceHome: '1.200.000',
        description: 'Noche de lujo y placer'
      },
      {
        name: 'Amanecida 8 Horas',
        duration: '8 horas',
        price: '1.300.000',
        priceHome: '1.500.000',
        description: 'Experiencia nocturna extendida'
      },
      {
        name: 'Amanecida 12 Horas',
        duration: '12 horas',
        price: '1.800.000',
        priceHome: '1.800.000',
        description: 'Media jornada de placer absoluto'
      },
      {
        name: '24 Horas',
        duration: '24 horas',
        price: '2.200.000',
        priceHome: '2.400.000',
        description: 'Día completo de experiencia VIP exclusiva'
      }
    ],
    specialties: [
      'Baile erótico',
      'Masajes',
      'Flexibilidad',
      'Trato de novios',
      'Experiencia VIP'
    ]
  },

  // ⭐ PERFIL REAL - NATALIA (Sede Norte)
  {
    id: 'natalia-004',
    name: 'Natalia',
    age: 21,
    photo: 'https://lh3.googleusercontent.com/d/1WtMylIcZS_q3v9EabMtc2XHJVOa-Z9zd',
    gallery: [
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
    ],
    rating: 5.0,
    height: '154 cm',
    measurements: '88-56-87',
    languages: ['Español'],
    location: 'Sede Norte',
    available: true,
    sedeId: 'sede-1',
    description: 'De piel trigueña y rasgos cautivadores, Natalia proyecta una belleza misteriosa y magnética que invita a descubrirla con calma. Pequeña de estatura, cabello negro y largo, combina una actitud pícara y segura con una presencia delicada y femenina. Cintura definida, curvas sutiles y una elegancia natural hacen de Natalia una experiencia discreta, intrigante y memorable.',
    services: [
      {
        name: '1 Hora',
        duration: '1 hora',
        price: '190.000',
        priceHome: '250.000',
        description: 'Encuentro íntimo y exclusivo'
      },
      {
        name: '2 Horas',
        duration: '2 horas',
        price: '360.000',
        priceHome: '480.000',
        description: 'Experiencia extendida sin apuros'
      },
      {
        name: 'Amanecida 6 Horas',
        duration: '6 horas',
        price: '950.000',
        priceHome: '1.200.000',
        description: 'Noche de lujo y placer'
      },
      {
        name: 'Amanecida 8 Horas',
        duration: '8 horas',
        price: '1.300.000',
        priceHome: '1.500.000',
        description: 'Experiencia nocturna extendida'
      },
      {
        name: 'Amanecida 12 Horas',
        duration: '12 horas',
        price: '1.800.000',
        priceHome: '1.800.000',
        description: 'Media jornada de placer absoluto'
      },
      {
        name: '24 Horas',
        duration: '24 horas',
        price: '2.200.000',
        priceHome: '2.400.000',
        description: 'Día completo de experiencia VIP exclusiva'
      }
    ],
    specialties: [
      'Baile erótico',
      'Masajes',
      'Flexibilidad',
      'Trato de novios',
      'Experiencia VIP'
    ]
  },

  // MODELOS DEMO - SEDE 1 - Zona Norte (3 modelos disponibles, 2 no disponibles)
  {
    id: '3',
    name: 'PERFIL_ELIMINADO',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400',
    ],
    rating: 5.0,
    height: '1.70m',
    measurements: '92-61-91',
    languages: ['Español', 'Inglés'],
    location: 'Zona Norte',
    available: false,
    sedeId: 'sede-1',
    description: 'ESTE PERFIL DEBE SER ELIMINADO',
    services: [
      { name: 'Encuentro 1h', duration: '1h', price: '380', description: 'Premium' },
      { name: 'Encuentro 2h', duration: '2h', price: '650', description: 'VIP' },
    ],
    specialties: ['Eventos', 'Trilingüe'],
  },
  
  // SEDE 2 - Centro (2 disponibles, 2 no disponibles)
  {
    id: '6',
    name: 'Luna',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1656438496600-bd46536ac165?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1656438496600-bd46536ac165?w=400',
    ],
    rating: 4.8,
    height: '1.70m',
    measurements: '92-62-92',
    languages: ['Español', 'Inglés', 'Francés'],
    location: 'Centro',
    available: true,
    sedeId: 'sede-2',
    description: 'Sofisticada y versátil, perfecta para acompañamiento corporativo.',
    services: [
      { name: 'Encuentro 1 hora', duration: '1h', price: '380', description: 'Ejecutivo' },
      { name: 'Acompañamiento Evento', duration: '4h', price: '1,400', description: 'Corporativo' },
    ],
    specialties: ['Eventos VIP', 'Trilingüe'],
  },
  {
    id: '7',
    name: 'Samantha',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    ],
    rating: 4.9,
    height: '1.68m',
    measurements: '90-60-91',
    languages: ['Español', 'Inglés'],
    location: 'Centro',
    available: true,
    sedeId: 'sede-2',
    description: 'Inteligente y encantadora, ideal para cenas de negocios.',
    services: [
      { name: 'Encuentro 1h', duration: '1h', price: '360', description: 'Standard' },
    ],
    specialties: ['Eventos', 'Conversación'],
  },
  {
    id: '8',
    name: 'Andrea',
    age: 28,
    photo: 'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=400',
    ],
    rating: 4.7,
    height: '1.69m',
    measurements: '91-61-90',
    languages: ['Español'],
    location: 'Centro',
    available: false,
    sedeId: 'sede-2',
    description: 'Madurez y experiencia en acompañamiento.',
    services: [
      { name: 'Encuentro 1h', duration: '1h', price: '340', description: 'Standard' },
    ],
    specialties: ['GFE'],
  },
  {
    id: '9',
    name: 'Carolina',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    ],
    rating: 4.8,
    height: '1.67m',
    measurements: '89-59-89',
    languages: ['Español', 'Inglés'],
    location: 'Centro',
    available: false,
    sedeId: 'sede-2',
    description: 'Dulce y profesional.',
    services: [
      { name: 'Encuentro 30min', duration: '30min', price: '190', description: 'Express' },
    ],
    specialties: ['Masajes'],
  },

  // SEDE 3 - Zona Rosa (2 disponibles, 1 no disponible)
  {
    id: '10',
    name: 'Valen',
    age: 23,
    photo: 'https://images.unsplash.com/photo-1580698864216-8008843ce6b0?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1580698864216-8008843ce6b0?w=400',
    ],
    rating: 4.9,
    height: '1.65m',
    measurements: '88-58-88',
    languages: ['Español', 'Inglés'],
    location: 'Zona Rosa',
    available: true,
    sedeId: 'sede-3',
    description: 'Joven y vibrante, con energía contagiosa.',
    services: [
      { name: 'Encuentro 30min', duration: '30min', price: '180', description: 'Express' },
      { name: 'Experiencia Sensual', duration: '3h', price: '800', description: 'Masajes' },
    ],
    specialties: ['Masajes', 'Sensualidad'],
  },
  {
    id: '11',
    name: 'Natalia',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    ],
    rating: 5.0,
    height: '1.71m',
    measurements: '93-62-93',
    languages: ['Español', 'Inglés'],
    location: 'Zona Rosa',
    available: true,
    sedeId: 'sede-3',
    description: 'Modelo de pasarela con experiencia en eventos de alto nivel.',
    services: [
      { name: 'Encuentro 1h', duration: '1h', price: '420', description: 'Premium' },
    ],
    specialties: ['Eventos', 'Modelaje'],
  },
  {
    id: '12',
    name: 'Gabriela',
    age: 22,
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
    ],
    rating: 4.6,
    height: '1.64m',
    measurements: '86-57-87',
    languages: ['Español'],
    location: 'Zona Rosa',
    available: false,
    sedeId: 'sede-3',
    description: 'Encantadora y divertida.',
    services: [
      { name: 'Encuentro 1h', duration: '1h', price: '310', description: 'Standard' },
    ],
    specialties: ['GFE'],
  },

  // SEDE 4 - Elite Spa (2 disponibles, 1 no disponible)
  {
    id: '13',
    name: 'Marcela',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    ],
    rating: 5.0,
    height: '1.69m',
    measurements: '91-60-90',
    languages: ['Español', 'Inglés', 'Portugués'],
    location: 'Zona Wellness',
    available: true,
    sedeId: 'sede-4',
    description: 'Especialista en terapias de relajación y experiencias sensuales.',
    services: [
      { name: 'Masaje Relajante', duration: '1h', price: '350', description: 'Spa' },
      { name: 'Experiencia Completa', duration: '2h', price: '700', description: 'Spa + GFE' },
    ],
    specialties: ['Masajes Profesionales', 'Spa'],
  },
  {
    id: '14',
    name: 'Juliana',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400',
    ],
    rating: 4.9,
    height: '1.68m',
    measurements: '90-61-91',
    languages: ['Español', 'Inglés'],
    location: 'Zona Wellness',
    available: true,
    sedeId: 'sede-4',
    description: 'Terapeuta certificada con toque mágico.',
    services: [
      { name: 'Masaje 1h', duration: '1h', price: '320', description: 'Relajante' },
    ],
    specialties: ['Masajes', 'Wellness'],
  },
  {
    id: '15',
    name: 'Patricia',
    age: 29,
    photo: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
    ],
    rating: 4.8,
    height: '1.66m',
    measurements: '88-59-89',
    languages: ['Español'],
    location: 'Zona Wellness',
    available: false,
    sedeId: 'sede-4',
    description: 'Experta en yoga y meditación.',
    services: [
      { name: 'Sesión 1h', duration: '1h', price: '300', description: 'Wellness' },
    ],
    specialties: ['Yoga', 'Meditación'],
  },

  // SEDE 5 - Penthouse (1 disponible, 1 no disponible)
  {
    id: '16',
    name: 'Sofia Diamond',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1648065460033-5c59f2ef1d97?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1648065460033-5c59f2ef1d97?w=400',
    ],
    rating: 5.0,
    height: '1.72m',
    measurements: '95-62-95',
    languages: ['Español', 'Inglés', 'Francés', 'Portugués'],
    location: 'Zona Exclusiva',
    available: true,
    sedeId: 'sede-5',
    description: 'Elite VIP. Sofisticación en su máxima expresión. Ideal para clientes exigentes que buscan lo mejor. Discreción absoluta garantizada.',
    services: [
      { name: 'Encuentro VIP 1h', duration: '1h', price: '450', description: 'Premium exclusivo' },
      { name: 'Cita Premium', duration: '4h', price: '1,500', description: 'Incluye suite y champagne' },
      { name: 'Overnight VIP', duration: '12h', price: '3,500', description: 'Noche de ensueño' },
    ],
    specialties: ['VIP Elite', 'Discreción Total', 'Multilingüe'],
  },
  {
    id: '17',
    name: 'Victoria',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?w=400',
    gallery: [
      'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?w=400',
    ],
    rating: 5.0,
    height: '1.74m',
    measurements: '94-61-93',
    languages: ['Español', 'Inglés', 'Italiano'],
    location: 'Zona Exclusiva',
    available: false,
    sedeId: 'sede-5',
    description: 'Modelo internacional de lujo.',
    services: [
      { name: 'Encuentro Elite', duration: '2h', price: '900', description: 'Ultra VIP' },
    ],
    specialties: ['Elite', 'Internacional'],
  },

  // ⭐ PERFIL REAL - XIMENA (Sede Norte)
  {
    id: 'ximena-005',
    name: 'Ximena',
    age: 21,
    photo: 'https://lh3.googleusercontent.com/d/15VwEzcm6jre_JugzQVF73LPnug1uKdtK',
    gallery: [
      'https://lh3.googleusercontent.com/d/15VwEzcm6jre_JugzQVF73LPnug1uKdtK',
      'https://lh3.googleusercontent.com/d/1o4hVclJUNY-3oK1odRhGkEdPahR8SQGa',
      'https://lh3.googleusercontent.com/d/1dIDy6glfXmf7ZeLE0sG8Ez0NLUZvax7c',
      'https://lh3.googleusercontent.com/d/1OQMkE_xi7-tmDzaUgmGaa4bG8g4Jmtw8',
      'https://lh3.googleusercontent.com/d/1ih65oHBeDHehh6QgARSKhGDfouu5p7N6',
      'https://lh3.googleusercontent.com/d/1e67Tj3RVy617VE6fRqW2WRX2wvhwMbbN',
      'https://lh3.googleusercontent.com/d/1G8vxZNk2KdOJJlZXeKrDBqm2RnrFgdRR',
      'https://lh3.googleusercontent.com/d/1lmHSNBo_6yphyAlHfw5JklXc7e8FSZR5',
      'https://lh3.googleusercontent.com/d/1-PwM1-WkDg7VIGpbTBMa-QrIZWnO6pA0',
      'https://lh3.googleusercontent.com/d/1kQB5jcCqY6FBFE16nj9IhnIsMgz0mqo5',
      'https://lh3.googleusercontent.com/d/1VDcJHeM22SmngYoRuWRQ-BIZIxcfpWXi',
      'https://lh3.googleusercontent.com/d/1RLGMyaRNnE7nV5mdWnIm5r9EXBm8IqRN'
    ],
    rating: 5.0,
    height: '148 cm',
    measurements: '92-73-96',
    languages: ['Español'],
    location: 'Sede Norte',
    available: false,
    sedeId: 'sede-1',
    description: 'Joven de rasgos delicados y mirada serena, Ximena destaca por una belleza suave y armoniosa, con una presencia dulce y envolvente. De estatura pequeña y silueta equilibrada, atraviesa una etapa especial de maternidad temprana que realza su luminosidad natural y feminidad. Su carisma tierno, trato cálido y actitud amorosa crean una experiencia cercana, sensible y profundamente acogedora.',
    services: [
      {
        name: '1 Hora',
        duration: '1 hora',
        price: '200.000',
        priceHome: '250.000',
        description: 'Encuentro íntimo y exclusivo'
      },
      {
        name: '2 Horas',
        duration: '2 horas',
        price: '380.000',
        priceHome: '480.000',
        description: 'Experiencia extendida sin apuros'
      },
      {
        name: 'Amanecida 6 Horas',
        duration: '6 horas',
        price: '1.000.000',
        priceHome: '1.200.000',
        description: 'Noche de lujo y placer'
      },
      {
        name: 'Amanecida 8 Horas',
        duration: '8 horas',
        price: '1.300.000',
        priceHome: '1.500.000',
        description: 'Experiencia nocturna extendida'
      },
      {
        name: 'Amanecida 12 Horas',
        duration: '12 horas',
        price: '1.600.000',
        priceHome: '1.800.000',
        description: 'Media jornada de placer absoluto'
      },
      {
        name: '24 Horas',
        duration: '24 horas',
        price: '2.000.000',
        priceHome: '2.400.000',
        description: 'Día completo de experiencia VIP exclusiva'
      }
    ],
    specialties: [
      'Baile erótico',
      'Masajes',
      'Flexibilidad',
      'Trato de novios',
      'Experiencia VIP',
      'Embarazada',
      'Lactancia'
    ]
  },
  {
    id: 'xiomara-006',
    name: 'Xiomara',
    age: 21,
    photo: 'https://lh3.googleusercontent.com/d/1fwmNRPyveOpDITUrekP9yJi-VjXjzx0p',
    gallery: [
      'https://lh3.googleusercontent.com/d/1fwmNRPyveOpDITUrekP9yJi-VjXjzx0p',
      'https://lh3.googleusercontent.com/d/1iPOewuzz0-thoNcMO78paE3ObbjPtqFS',
      'https://lh3.googleusercontent.com/d/1rUt1gLC39a4VsbInrQbT0i-RbBjQ9pLj',
      'https://lh3.googleusercontent.com/d/1xTFIJBvc7T2ZINocxn29G0_3iiTDtYxK',
      'https://lh3.googleusercontent.com/d/18PGP1od1LkegXHyx3r94iiKg78Wx75G8',
      'https://lh3.googleusercontent.com/d/1GKAAgGVDM7hBLjzrMPe3j_r582O2cwep',
      'https://lh3.googleusercontent.com/d/1MG1IhsIUhCKqAufzUpLBS5fT9LHJhSdC',
      'https://lh3.googleusercontent.com/d/1vAynh1FZiAkYrjAkgQ3QjB6ObS9pAKl5',
      'https://lh3.googleusercontent.com/d/1Q8QSyS8rpT2Fpfw41iMv8d3ZzO9NnSYI'
    ],
    rating: 5.0,
    height: '167 cm',
    measurements: '97-73-99',
    languages: ['Español'],
    location: 'Sede Norte',
    available: true,
    sedeId: 'sede-1',
    description: 'Alta y voluptuosa, Xiomara irradia una presencia segura y vibrante, con una energía alegre y apasionada que se siente desde el primer encuentro. Con formación en enfermería, aporta conocimiento, cuidado y técnica, combinando bienestar físico con una atención atenta y respetuosa. Especialista en masajes terapéuticos, relajantes y experiencias avanzadas de bienestar, ofrece un servicio completo, preciso y profundamente satisfactorio.',
    services: [
      {
        name: '1 Hora',
        duration: '1 hora',
        price: '160.000',
        priceHome: '250.000',
        description: 'Encuentro íntimo y exclusivo'
      },
      {
        name: '2 Horas',
        duration: '2 horas',
        price: '300.000',
        priceHome: '480.000',
        description: 'Experiencia extendida sin apuros'
      },
      {
        name: 'Amanecida 6 Horas',
        duration: '6 horas',
        price: '800.000',
        priceHome: '1.200.000',
        description: 'Noche de lujo y placer'
      },
      {
        name: 'Amanecida 8 Horas',
        duration: '8 horas',
        price: '1.100.000',
        priceHome: '1.500.000',
        description: 'Experiencia nocturna extendida'
      },
      {
        name: 'Amanecida 12 Horas',
        duration: '12 horas',
        price: '1.500.000',
        priceHome: '1.800.000',
        description: 'Media jornada de placer absoluto'
      },
      {
        name: '24 Horas',
        duration: '24 horas',
        price: '1.900.000',
        priceHome: '2.400.000',
        description: 'Día completo de experiencia VIP exclusiva'
      }
    ],
    specialties: [
      'Baile erótico',
      'Masajes',
      'Trato de novios',
      'Experiencia VIP',
      'Senos grandes',
      'Cola grande',
      'Masaje prostático',
      'Dominación'
    ]
  },
  {
    id: 'roxxy-007',
    name: 'Roxxy',
    age: 23,
    photo: 'https://lh3.googleusercontent.com/d/1R0TH4ErmsQEuduY0kevq7WZgP6c19fFB',
    gallery: [
      'https://lh3.googleusercontent.com/d/1R0TH4ErmsQEuduY0kevq7WZgP6c19fFB',
      'https://lh3.googleusercontent.com/d/1nWDWPCAPB2EGJjNOoK64w7fjDbhsoVXQ',
      'https://lh3.googleusercontent.com/d/1SF0jtn8mNpX2P7Tos1ZTt6cnTf224juz',
      'https://lh3.googleusercontent.com/d/1fp9EZ5LuC_BYJSJx725AVdjYJMxo-gkY',
      'https://lh3.googleusercontent.com/d/1n4tMpVr7w4RrevoRu6MzxM4xe9YFDpJa',
      'https://lh3.googleusercontent.com/d/1gE6I-4_3RlEUs4BBWil3SRO56z7TnprJ',
      'https://lh3.googleusercontent.com/d/1KX3Ep_xFszxJsdIPPp8qcXSySV5tiMOD',
      'https://lh3.googleusercontent.com/d/1JIEOzCMtKDx4y81CFbwrdAu_3i98_3ac',
      'https://lh3.googleusercontent.com/d/1g16jYtd4bkzi05YGNlfI5XHF3RZDEgIR',
      'https://lh3.googleusercontent.com/d/1HLlo4eDy6mZdT9JhfjaveWxWLer0jvn4'
    ],
    rating: 5.0,
    height: '154 cm',
    measurements: '88-68-92',
    languages: ['Español'],
    location: 'Sede Norte',
    available: false,
    sedeId: 'sede-1',
    description: 'Belleza serena, Roxxy destaca por su trato suave y delicado, con una piel cuidada y naturalmente luminosa. Gentil, positiva y generosa, transmite una actitud cercana y receptiva que invita a la confianza y al bienestar. Su silueta armoniosa, con curvas firmes y una presencia dulce y equilibrada, completa una experiencia cálida y refinada.',
    services: [
      {
        name: '1 Hora',
        duration: '1 hora',
        price: '160.000',
        priceHome: '250.000',
        description: 'Encuentro íntimo y exclusivo'
      },
      {
        name: '2 Horas',
        duration: '2 horas',
        price: '300.000',
        priceHome: '480.000',
        description: 'Experiencia extendida sin apuros'
      },
      {
        name: 'Amanecida 6 Horas',
        duration: '6 horas',
        price: '800.000',
        priceHome: '1.200.000',
        description: 'Noche de lujo y placer'
      },
      {
        name: 'Amanecida 8 Horas',
        duration: '8 horas',
        price: '1.100.000',
        priceHome: '1.500.000',
        description: 'Experiencia nocturna extendida'
      },
      {
        name: 'Amanecida 12 Horas',
        duration: '12 horas',
        price: '1.500.000',
        priceHome: '1.800.000',
        description: 'Media jornada de placer absoluto'
      },
      {
        name: '24 Horas',
        duration: '24 horas',
        price: '1.900.000',
        priceHome: '2.400.000',
        description: 'Día completo de experiencia VIP exclusiva'
      }
    ],
    specialties: [
      'Baile erótico',
      'Masajes',
      'Trato de novios',
      'Experiencia VIP'
    ]
  }
];

// Funciones auxiliares para filtrar modelos por sede
export const getModelosPorSede = (sedeId: string) => {
  return allModels.filter(model => model.sedeId === sedeId && model.id !== '3');
};

export const getModelosDisponiblesPorSede = (sedeId: string) => {
  return allModels.filter(model => model.sedeId === sedeId && model.available && model.id !== '3');
};

export const getModelosNoDisponiblesPorSede = (sedeId: string) => {
  return allModels.filter(model => model.sedeId === sedeId && !model.available && model.id !== '3');
};