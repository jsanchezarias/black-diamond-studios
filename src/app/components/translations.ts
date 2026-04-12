export type Language = 'es' | 'en' | 'fr' | 'pt';

export interface Translations {
  nav: {
    home: string;
    services: string;
    models: string;
    about: string;
    contact: string;
    login: string;
    systemAccess: string;
  };
  hero: {
    liveStream: string;
    exclusiveModel: string;
  };
  services: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    personalMeetings: {
      title: string;
      description: string;
      badge: string;
    };
    homeService: {
      title: string;
      description: string;
      badge: string;
    };
    vipSuites: {
      title: string;
      description: string;
      badge: string;
    };
    gfeExperience: {
      title: string;
      description: string;
      badge: string;
    };
    specialEvents: {
      title: string;
      description: string;
      badge: string;
    };
    boutique: {
      title: string;
      description: string;
      badge: string;
    };
  };
  models: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    available: string;
    unavailable: string;
    yearsOld: string;
    aboutMe: string;
    height: string;
    measurements: string;
    languages: string;
    servicesAvailable: string;
    ratesInfo: string;
    reserve: string;
    viewAll: string;
    gallery: string;
    ctaText: string;
    ctaButton: string;
  };
  about: {
    badge: string;
    title: string;
    titleHighlight: string;
    totalSecurity: {
      title: string;
      description: string;
    };
    premiumQuality: {
      title: string;
      description: string;
    };
    ourValues: string;
    respect: {
      title: string;
      description: string;
    };
    confidentiality: {
      title: string;
      description: string;
    };
    excellence: {
      title: string;
      description: string;
    };
  };
  contact: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    whatsapp: string;
    whatsappDesc: string;
    twitter: string;
    twitterDesc: string;
    email: string;
    emailDesc: string;
    ctaTitle: string;
    ctaDescription: string;
    reserveNow: string;
    systemAccess: string;
  };
  footer: {
    description: string;
    quickLinks: string;
    schedule: string;
    mondayToSunday: string;
    hours24: string;
    whatsappAttention: string;
    immediate: string;
    rights: string;
    termsOfService: string;
    privacyPolicy: string;
  };
  chat: {
    liveChat: string;
    online: string;
    logout: string;
    login: string;
    register: string;
    typeMessage: string;
    send: string;
    enterUsername: string;
    enterPassword: string;
    enterEmail: string;
    loginButton: string;
    registerButton: string;
    noAccount: string;
    haveAccount: string;
    welcome: string;
  };
  modelCard: {
    availableNow: string;
    busy: string;
    photoGallery: string;
    viewAll: string;
    aboutMe: string;
    height: string;
    measurements: string;
    languages: string;
    servicesAvailable: string;
    ratesInfo: string;
    homeDelivery: string;
    vipSuite: string;
    overnight: string;
    included: string;
    consult: string;
    reserveWith: string;
  };
}

export const translations: Record<Language, Translations> = {
  es: {
    nav: {
      home: 'Inicio',
      services: 'Servicios',
      models: 'Nuestras Modelos',
      about: 'Sobre Nosotros',
      contact: 'Contacto',
      login: 'Iniciar Sesión',
      systemAccess: 'Acceso Sistema',
    },
    hero: {
      liveStream: 'Transmisión en Vivo Exclusiva',
      exclusiveModel: 'Black Diamond',
    },
    services: {
      badge: 'Nuestros Servicios',
      title: 'Experiencias',
      titleHighlight: 'Exclusivas',
      subtitle: 'Servicios diseñados para satisfacer los más altos estándares de exigencia',
      personalMeetings: {
        title: 'Encuentros Personalizados',
        description: 'Desde 30 minutos hasta amanecidas completas. Experiencias adaptadas a tu agenda y preferencias.',
        badge: 'Servicio Premium',
      },
      homeService: {
        title: 'Servicio a Domicilio',
        description: 'Atención en la comodidad de tu hotel o residencia. Máxima discreción y puntualidad garantizada.',
        badge: '100% Confidencial',
      },
      vipSuites: {
        title: 'Suites Privadas VIP',
        description: 'Habitaciones de lujo completamente equipadas. Ambiente sofisticado y servicios adicionales disponibles.',
        badge: 'Instalaciones Premium',
      },
      gfeExperience: {
        title: 'Experiencia GFE',
        description: 'Girlfriend Experience auténtica. Conexión genuina, conversaciones profundas y momentos inolvidables.',
        badge: 'Altamente Solicitado',
      },
      specialEvents: {
        title: 'Eventos Especiales',
        description: 'Acompañamiento para cenas, eventos corporativos o sociales. Elegancia y distinción garantizadas.',
        badge: 'Elite Selection',
      },
      boutique: {
        title: 'Boutique Exclusiva',
        description: 'Lencería fina, perfumes premium y accesorios de lujo. Complementa tu experiencia con productos selectos.',
        badge: 'Productos Premium',
      },
    },
    models: {
      badge: 'Nuestro Equipo',
      title: 'Modelos',
      titleHighlight: 'Elite',
      subtitle: 'Mujeres excepcionales seleccionadas por su belleza, inteligencia y profesionalismo',
      available: 'Disponible Ahora',
      unavailable: 'Ocupada',
      yearsOld: 'años',
      aboutMe: 'Sobre mí',
      height: 'Estatura',
      measurements: 'Medidas',
      languages: 'Idiomas',
      servicesAvailable: 'Servicios Disponibles',
      ratesInfo: 'Información de Tarifas',
      reserve: 'Reservar con',
      viewAll: 'Ver todas',
      gallery: 'Galería de Fotos',
      ctaText: '¿Quieres conocer todo nuestro portafolio?',
      ctaButton: 'Contactar Ahora',
    },
    about: {
      badge: 'Nuestra Historia',
      title: 'Excelencia y',
      titleHighlight: 'Discreción',
      totalSecurity: {
        title: 'Seguridad Total',
        description: 'Protocolos estrictos de verificación y confidencialidad. Todas nuestras modelos pasan por un riguroso proceso de selección y certificación médica actualizada.',
      },
      premiumQuality: {
        title: 'Calidad Premium',
        description: 'Más de 4 años brindando experiencias memorables. Nuestro compromiso con la excelencia nos ha posicionado como referente en servicios de acompañamiento de lujo.',
      },
      ourValues: 'Nuestros Valores',
      respect: {
        title: 'Respeto',
        description: 'Tratamos a cada cliente y modelo con la máxima consideración',
      },
      confidentiality: {
        title: 'Confidencialidad',
        description: 'Tu privacidad es nuestra prioridad absoluta',
      },
      excellence: {
        title: 'Excelencia',
        description: 'Superamos expectativas en cada detalle',
      },
    },
    contact: {
      badge: 'Contáctanos',
      title: 'Agenda Tu',
      titleHighlight: 'Experiencia',
      subtitle: 'Estamos disponibles 24/7 para atender tus consultas y reservas',
      whatsapp: 'WhatsApp',
      whatsappDesc: 'Respuesta inmediata',
      twitter: 'Twitter',
      twitterDesc: 'Síguenos para novedades',
      email: 'Email',
      emailDesc: 'Consultas generales',
      ctaTitle: '¿Listo para una Experiencia Inolvidable?',
      ctaDescription: 'Nuestro equipo está disponible para ayudarte a seleccionar la modelo perfecta y coordinar todos los detalles de tu encuentro.',
      reserveNow: 'Reservar Ahora',
      systemAccess: 'Acceso Sistema',
    },
    footer: {
      description: 'Agencia premium de acompañamiento de lujo. Experiencias exclusivas con las modelos más sofisticadas y profesionales de la ciudad.',
      quickLinks: 'Enlaces Rápidos',
      schedule: 'Horarios',
      mondayToSunday: 'Lunes - Domingo',
      hours24: '24 Horas',
      whatsappAttention: 'Atención WhatsApp',
      immediate: 'Inmediata',
      rights: '© 2024 Black Diamond Studios. Todos los derechos reservados.',
      termsOfService: 'Términos de Servicio',
      privacyPolicy: 'Política de Privacidad',
    },
    chat: {
      liveChat: 'Chat en Vivo',
      online: 'En línea',
      logout: 'Salir',
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      typeMessage: 'Escribe un mensaje...',
      send: 'Enviar',
      enterUsername: 'Usuario',
      enterPassword: 'Contraseña',
      enterEmail: 'Email',
      loginButton: 'Entrar',
      registerButton: 'Crear Cuenta',
      noAccount: '¿No tienes cuenta?',
      haveAccount: '¿Ya tienes cuenta?',
      welcome: 'Bienvenido al chat',
    },
    modelCard: {
      availableNow: 'Disponible Ahora',
      busy: 'Ocupada',
      photoGallery: 'Galería de Fotos',
      viewAll: 'Ver todas',
      aboutMe: 'Sobre mí',
      height: 'Estatura:',
      measurements: 'Medidas:',
      languages: 'Idiomas:',
      servicesAvailable: 'Servicios Disponibles',
      ratesInfo: 'Información de Tarifas',
      homeDelivery: 'Domicilio (zona norte):',
      vipSuite: 'Suite privada VIP:',
      overnight: 'Servicio amanecida:',
      included: 'Incluido',
      consult: 'Consultar',
      reserveWith: 'Reservar con',
    },
  },
  en: {
    nav: {
      home: 'Home',
      services: 'Services',
      models: 'Our Models',
      about: 'About Us',
      contact: 'Contact',
      login: 'Login',
      systemAccess: 'System Access',
    },
    hero: {
      liveStream: 'Exclusive Live Stream',
      exclusiveModel: 'Black Diamond',
    },
    services: {
      badge: 'Our Services',
      title: 'Exclusive',
      titleHighlight: 'Experiences',
      subtitle: 'Services designed to meet the highest standards of excellence',
      personalMeetings: {
        title: 'Personalized Meetings',
        description: 'From 30 minutes to full overnights. Experiences tailored to your schedule and preferences.',
        badge: 'Premium Service',
      },
      homeService: {
        title: 'Home Service',
        description: 'Service in the comfort of your hotel or residence. Maximum discretion and punctuality guaranteed.',
        badge: '100% Confidential',
      },
      vipSuites: {
        title: 'VIP Private Suites',
        description: 'Fully equipped luxury rooms. Sophisticated environment and additional services available.',
        badge: 'Premium Facilities',
      },
      gfeExperience: {
        title: 'GFE Experience',
        description: 'Authentic Girlfriend Experience. Genuine connection, deep conversations and unforgettable moments.',
        badge: 'Highly Requested',
      },
      specialEvents: {
        title: 'Special Events',
        description: 'Companionship for dinners, corporate or social events. Elegance and distinction guaranteed.',
        badge: 'Elite Selection',
      },
      boutique: {
        title: 'Exclusive Boutique',
        description: 'Fine lingerie, premium perfumes and luxury accessories. Complement your experience with select products.',
        badge: 'Premium Products',
      },
    },
    models: {
      badge: 'Our Team',
      title: 'Elite',
      titleHighlight: 'Models',
      subtitle: 'Exceptional women selected for their beauty, intelligence and professionalism',
      available: 'Available Now',
      unavailable: 'Busy',
      yearsOld: 'years old',
      aboutMe: 'About me',
      height: 'Height',
      measurements: 'Measurements',
      languages: 'Languages',
      servicesAvailable: 'Available Services',
      ratesInfo: 'Rates Information',
      reserve: 'Book with',
      viewAll: 'View all',
      gallery: 'Photo Gallery',
      ctaText: 'Want to see our complete portfolio?',
      ctaButton: 'Contact Now',
    },
    about: {
      badge: 'Our Story',
      title: 'Excellence and',
      titleHighlight: 'Discretion',
      totalSecurity: {
        title: 'Total Security',
        description: 'Strict verification and confidentiality protocols. All our models go through a rigorous selection process and updated medical certification.',
      },
      premiumQuality: {
        title: 'Premium Quality',
        description: 'Over 4 years providing memorable experiences. Our commitment to excellence has positioned us as a reference in luxury companionship services.',
      },
      ourValues: 'Our Values',
      respect: {
        title: 'Respect',
        description: 'We treat every client and model with the utmost consideration',
      },
      confidentiality: {
        title: 'Confidentiality',
        description: 'Your privacy is our absolute priority',
      },
      excellence: {
        title: 'Excellence',
        description: 'We exceed expectations in every detail',
      },
    },
    contact: {
      badge: 'Contact Us',
      title: 'Schedule Your',
      titleHighlight: 'Experience',
      subtitle: 'We are available 24/7 to handle your inquiries and reservations',
      whatsapp: 'WhatsApp',
      whatsappDesc: 'Immediate response',
      twitter: 'Twitter',
      twitterDesc: 'Follow us for updates',
      email: 'Email',
      emailDesc: 'General inquiries',
      ctaTitle: 'Ready for an Unforgettable Experience?',
      ctaDescription: 'Our team is available to help you select the perfect model and coordinate all the details of your encounter.',
      reserveNow: 'Book Now',
      systemAccess: 'System Access',
    },
    footer: {
      description: 'Premium luxury companionship agency. Exclusive experiences with the most sophisticated and professional models in the city.',
      quickLinks: 'Quick Links',
      schedule: 'Schedule',
      mondayToSunday: 'Monday - Sunday',
      hours24: '24 Hours',
      whatsappAttention: 'WhatsApp Support',
      immediate: 'Immediate',
      rights: '© 2024 Black Diamond Studios. All rights reserved.',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
    },
    chat: {
      liveChat: 'Live Chat',
      online: 'Online',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
      typeMessage: 'Type a message...',
      send: 'Send',
      enterUsername: 'Username',
      enterPassword: 'Password',
      enterEmail: 'Email',
      loginButton: 'Sign In',
      registerButton: 'Create Account',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      welcome: 'Welcome to chat',
    },
    modelCard: {
      availableNow: 'Available Now',
      busy: 'Busy',
      photoGallery: 'Photo Gallery',
      viewAll: 'View all',
      aboutMe: 'About me',
      height: 'Height:',
      measurements: 'Measurements:',
      languages: 'Languages:',
      servicesAvailable: 'Available Services',
      ratesInfo: 'Rates Information',
      homeDelivery: 'Home delivery (north zone):',
      vipSuite: 'VIP private suite:',
      overnight: 'Overnight service:',
      included: 'Included',
      consult: 'Consult',
      reserveWith: 'Book with',
    },
  },
  fr: {
    nav: {
      home: 'Accueil',
      services: 'Services',
      models: 'Nos Modèles',
      about: 'À Propos',
      contact: 'Contact',
      login: 'Connexion',
      systemAccess: 'Accès Système',
    },
    hero: {
      liveStream: 'Diffusion en Direct Exclusive',
      exclusiveModel: 'Black Diamond',
    },
    services: {
      badge: 'Nos Services',
      title: 'Expériences',
      titleHighlight: 'Exclusives',
      subtitle: 'Services conçus pour répondre aux plus hauts standards d\'excellence',
      personalMeetings: {
        title: 'Rencontres Personnalisées',
        description: 'De 30 minutes à des nuits complètes. Expériences adaptées à votre emploi du temps et préférences.',
        badge: 'Service Premium',
      },
      homeService: {
        title: 'Service à Domicile',
        description: 'Service dans le confort de votre hôtel ou résidence. Discrétion maximale et ponctualité garantie.',
        badge: '100% Confidentiel',
      },
      vipSuites: {
        title: 'Suites Privées VIP',
        description: 'Chambres de luxe entièrement équipées. Environnement sophistiqué et services supplémentaires disponibles.',
        badge: 'Installations Premium',
      },
      gfeExperience: {
        title: 'Expérience GFE',
        description: 'Expérience Girlfriend authentique. Connexion authentique, conversations profondes et moments inoubliables.',
        badge: 'Très Demandé',
      },
      specialEvents: {
        title: 'Événements Spéciaux',
        description: 'Accompagnement pour dîners, événements corporatifs ou sociaux. Élégance et distinction garanties.',
        badge: 'Sélection Élite',
      },
      boutique: {
        title: 'Boutique Exclusive',
        description: 'Lingerie fine, parfums premium et accessoires de luxe. Complétez votre expérience avec des produits sélectionnés.',
        badge: 'Produits Premium',
      },
    },
    models: {
      badge: 'Notre Équipe',
      title: 'Modèles',
      titleHighlight: 'Élite',
      subtitle: 'Femmes exceptionnelles sélectionnées pour leur beauté, intelligence et professionnalisme',
      available: 'Disponible Maintenant',
      unavailable: 'Occupée',
      yearsOld: 'ans',
      aboutMe: 'À propos de moi',
      height: 'Taille',
      measurements: 'Mesures',
      languages: 'Langues',
      servicesAvailable: 'Services Disponibles',
      ratesInfo: 'Informations Tarifaires',
      reserve: 'Réserver avec',
      viewAll: 'Voir tout',
      gallery: 'Galerie de Photos',
      ctaText: 'Vous voulez voir notre portfolio complet?',
      ctaButton: 'Contactez Maintenant',
    },
    about: {
      badge: 'Notre Histoire',
      title: 'Excellence et',
      titleHighlight: 'Discrétion',
      totalSecurity: {
        title: 'Sécurité Totale',
        description: 'Protocoles stricts de vérification et confidentialité. Tous nos modèles passent par un processus de sélection rigoureux et une certification médicale à jour.',
      },
      premiumQuality: {
        title: 'Qualité Premium',
        description: 'Plus de 4 ans à offrir des expériences mémorables. Notre engagement envers l\'excellence nous a positionnés comme référence dans les services d\'accompagnement de luxe.',
      },
      ourValues: 'Nos Valeurs',
      respect: {
        title: 'Respect',
        description: 'Nous traitons chaque client et modèle avec la plus grande considération',
      },
      confidentiality: {
        title: 'Confidentialité',
        description: 'Votre vie privée est notre priorité absolue',
      },
      excellence: {
        title: 'Excellence',
        description: 'Nous dépassons les attentes dans chaque détail',
      },
    },
    contact: {
      badge: 'Contactez-Nous',
      title: 'Planifiez Votre',
      titleHighlight: 'Expérience',
      subtitle: 'Nous sommes disponibles 24/7 pour gérer vos demandes et réservations',
      whatsapp: 'WhatsApp',
      whatsappDesc: 'Réponse immédiate',
      twitter: 'Twitter',
      twitterDesc: 'Suivez-nous pour les nouveautés',
      email: 'Email',
      emailDesc: 'Demandes générales',
      ctaTitle: 'Prêt pour une Expérience Inoubliable?',
      ctaDescription: 'Notre équipe est disponible pour vous aider à sélectionner le modèle parfait et coordonner tous les détails de votre rencontre.',
      reserveNow: 'Réserver Maintenant',
      systemAccess: 'Accès Système',
    },
    footer: {
      description: 'Agence premium d\'accompagnement de luxe. Expériences exclusives avec les modèles les plus sophistiqués et professionnels de la ville.',
      quickLinks: 'Liens Rapides',
      schedule: 'Horaires',
      mondayToSunday: 'Lundi - Dimanche',
      hours24: '24 Heures',
      whatsappAttention: 'Support WhatsApp',
      immediate: 'Immédiat',
      rights: '© 2024 Black Diamond Studios. Tous droits réservés.',
      termsOfService: 'Conditions de Service',
      privacyPolicy: 'Politique de Confidentialité',
    },
    chat: {
      liveChat: 'Chat en Direct',
      online: 'En ligne',
      logout: 'Déconnexion',
      login: 'Connexion',
      register: 'S\'inscrire',
      typeMessage: 'Tapez un message...',
      send: 'Envoyer',
      enterUsername: 'Nom d\'utilisateur',
      enterPassword: 'Mot de passe',
      enterEmail: 'Email',
      loginButton: 'Se Connecter',
      registerButton: 'Créer un Compte',
      noAccount: 'Pas de compte?',
      haveAccount: 'Déjà un compte?',
      welcome: 'Bienvenue au chat',
    },
    modelCard: {
      availableNow: 'Disponible Maintenant',
      busy: 'Occupée',
      photoGallery: 'Galerie de Photos',
      viewAll: 'Voir tout',
      aboutMe: 'À propos de moi',
      height: 'Taille:',
      measurements: 'Mesures:',
      languages: 'Langues:',
      servicesAvailable: 'Services Disponibles',
      ratesInfo: 'Informations Tarifaires',
      homeDelivery: 'Livraison à domicile (zone nord):',
      vipSuite: 'Suite privée VIP:',
      overnight: 'Service nuit complète:',
      included: 'Inclus',
      consult: 'Consulter',
      reserveWith: 'Réserver avec',
    },
  },
  pt: {
    nav: {
      home: 'Início',
      services: 'Serviços',
      models: 'Nossas Modelos',
      about: 'Sobre Nós',
      contact: 'Contato',
      login: 'Login',
      systemAccess: 'Acesso ao Sistema',
    },
    hero: {
      liveStream: 'Transmissão ao Vivo Exclusiva',
      exclusiveModel: 'Black Diamond',
    },
    services: {
      badge: 'Nossos Serviços',
      title: 'Experiências',
      titleHighlight: 'Exclusivas',
      subtitle: 'Serviços projetados para atender os mais altos padrões de exigência',
      personalMeetings: {
        title: 'Encontros Personalizados',
        description: 'De 30 minutos até pernoites completos. Experiências adaptadas à sua agenda e preferências.',
        badge: 'Serviço Premium',
      },
      homeService: {
        title: 'Serviço em Domicílio',
        description: 'Atendimento no conforto do seu hotel ou residência. Máxima discrição e pontualidade garantida.',
        badge: '100% Confidencial',
      },
      vipSuites: {
        title: 'Suítes Privadas VIP',
        description: 'Quartos de luxo totalmente equipados. Ambiente sofisticado e serviços adicionais disponíveis.',
        badge: 'Instalações Premium',
      },
      gfeExperience: {
        title: 'Experiência GFE',
        description: 'Girlfriend Experience autêntica. Conexão genuína, conversas profundas e momentos inesquecíveis.',
        badge: 'Muito Solicitado',
      },
      specialEvents: {
        title: 'Eventos Especiais',
        description: 'Acompanhamento para jantares, eventos corporativos ou sociais. Elegância e distinção garantidas.',
        badge: 'Seleção Elite',
      },
      boutique: {
        title: 'Boutique Exclusiva',
        description: 'Lingerie fina, perfumes premium e acessórios de luxo. Complemente sua experiência com produtos selecionados.',
        badge: 'Produtos Premium',
      },
    },
    models: {
      badge: 'Nossa Equipe',
      title: 'Modelos',
      titleHighlight: 'Elite',
      subtitle: 'Mulheres excepcionais selecionadas por sua beleza, inteligência e profissionalismo',
      available: 'Disponível Agora',
      unavailable: 'Ocupada',
      yearsOld: 'anos',
      aboutMe: 'Sobre mim',
      height: 'Altura',
      measurements: 'Medidas',
      languages: 'Idiomas',
      servicesAvailable: 'Serviços Disponíveis',
      ratesInfo: 'Informações de Tarifas',
      reserve: 'Reservar com',
      viewAll: 'Ver tudo',
      gallery: 'Galeria de Fotos',
      ctaText: 'Quer conhecer todo nosso portfólio?',
      ctaButton: 'Contatar Agora',
    },
    about: {
      badge: 'Nossa História',
      title: 'Excelência e',
      titleHighlight: 'Discrição',
      totalSecurity: {
        title: 'Segurança Total',
        description: 'Protocolos rigorosos de verificação e confidencialidade. Todas as nossas modelos passam por um processo rigoroso de seleção e certificação médica atualizada.',
      },
      premiumQuality: {
        title: 'Qualidade Premium',
        description: 'Mais de 4 anos proporcionando experiências memoráveis. Nosso compromisso com a excelência nos posicionou como referência em serviços de acompanhamento de luxo.',
      },
      ourValues: 'Nossos Valores',
      respect: {
        title: 'Respeito',
        description: 'Tratamos cada cliente e modelo com a máxima consideração',
      },
      confidentiality: {
        title: 'Confidencialidade',
        description: 'Sua privacidade é nossa prioridade absoluta',
      },
      excellence: {
        title: 'Excelência',
        description: 'Superamos expectativas em cada detalhe',
      },
    },
    contact: {
      badge: 'Contate-Nos',
      title: 'Agende Sua',
      titleHighlight: 'Experiência',
      subtitle: 'Estamos disponíveis 24/7 para atender suas consultas e reservas',
      whatsapp: 'WhatsApp',
      whatsappDesc: 'Resposta imediata',
      twitter: 'Twitter',
      twitterDesc: 'Siga-nos para novidades',
      email: 'Email',
      emailDesc: 'Consultas gerais',
      ctaTitle: 'Pronto para uma Experiência Inesquecível?',
      ctaDescription: 'Nossa equipe está disponível para ajudá-lo a selecionar a modelo perfeita e coordenar todos os detalhes do seu encontro.',
      reserveNow: 'Reservar Agora',
      systemAccess: 'Acesso ao Sistema',
    },
    footer: {
      description: 'Agência premium de acompanhamento de luxo. Experiências exclusivas com as modelos mais sofisticadas e profissionais da cidade.',
      quickLinks: 'Links Rápidos',
      schedule: 'Horários',
      mondayToSunday: 'Segunda - Domingo',
      hours24: '24 Horas',
      whatsappAttention: 'Atendimento WhatsApp',
      immediate: 'Imediato',
      rights: '© 2024 Black Diamond Studios. Todos os direitos reservados.',
      termsOfService: 'Termos de Serviço',
      privacyPolicy: 'Política de Privacidade',
    },
    chat: {
      liveChat: 'Chat ao Vivo',
      online: 'Online',
      logout: 'Sair',
      login: 'Entrar',
      register: 'Registrar',
      typeMessage: 'Digite uma mensagem...',
      send: 'Enviar',
      enterUsername: 'Usuário',
      enterPassword: 'Senha',
      enterEmail: 'Email',
      loginButton: 'Entrar',
      registerButton: 'Criar Conta',
      noAccount: 'Não tem conta?',
      haveAccount: 'Já tem conta?',
      welcome: 'Bem-vindo ao chat',
    },
    modelCard: {
      availableNow: 'Disponível Agora',
      busy: 'Ocupada',
      photoGallery: 'Galeria de Fotos',
      viewAll: 'Ver tudo',
      aboutMe: 'Sobre mim',
      height: 'Altura:',
      measurements: 'Medidas:',
      languages: 'Idiomas:',
      servicesAvailable: 'Serviços Disponíveis',
      ratesInfo: 'Informações de Tarifas',
      homeDelivery: 'Entrega em domicílio (zona norte):',
      vipSuite: 'Suíte privada VIP:',
      overnight: 'Serviço pernoite:',
      included: 'Incluído',
      consult: 'Consultar',
      reserveWith: 'Reservar com',
    },
  },
};