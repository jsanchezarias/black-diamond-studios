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
];

export const allModels: Model[] = [
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
    rating: 5.0,
    height: '1.65m',
    measurements: '90-65-96',
    languages: ['Español', 'Inglés'],
    location: 'Zona Norte Premium',
    available: true,
    sedeId: 'sede-1',
    description: 'Colombo-venezolana radicada en Bogotá desde hace más de seis años, Annie combina formación en glamour con una presencia impecable y sofisticada. Alegre, divertida y descomplicada, destaca por su trato cercano y uno de los servicios más cuidados y exclusivos de la casa. Elegancia natural, seguridad absoluta y una silueta trabajada al detalle —con especial orgullo en sus curvas— definen su encanto.',
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
    height: '1.50m',
    measurements: '85-58-87',
    languages: ['Español'],
    location: 'Zona Norte Premium',
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
    height: '1.70m',
    measurements: '90-63-94',
    languages: ['Español'],
    location: 'Zona Norte Premium',
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
    height: '1.54m',
    measurements: '88-56-87',
    languages: ['Español'],
    location: 'Zona Norte Premium',
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
    height: '1.48m',
    measurements: '92-73-96',
    languages: ['Español'],
    location: 'Zona Norte Premium',
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
    height: '1.67m',
    measurements: '97-73-99',
    languages: ['Español'],
    location: 'Zona Norte Premium',
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
    height: '1.54m',
    measurements: '88-68-92',
    languages: ['Español'],
    location: 'Zona Norte Premium',
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

export const getModelosPorSede = (sedeId: string) => {
  return allModels.filter(model => model.sedeId === sedeId);
};

export const getModelosDisponiblesPorSede = (sedeId: string) => {
  return allModels.filter(model => model.sedeId === sedeId && model.available);
};

export const getModelosNoDisponiblesPorSede = (sedeId: string) => {
  return allModels.filter(model => model.sedeId === sedeId && !model.available);
};