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
  };
  models: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    available: string;
    unavailable: string;
    yearsOld: string;
    reserve: string;
  };
  about: {
    badge: string;
    title: string;
    titleHighlight: string;
  };
  contact: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
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
      about: 'Nosotros',
      contact: 'Contacto',
      login: 'Iniciar Sesión',
      systemAccess: 'Acceso al Sistema',
    },
    hero: {
      liveStream: 'Stream en Vivo',
      exclusiveModel: 'Modelo Exclusiva',
    },
    services: {
      badge: 'Servicios Exclusivos',
      title: 'Experiencias',
      titleHighlight: 'Únicas',
      subtitle: 'Servicios premium diseñados para tu máximo placer',
    },
    models: {
      badge: 'Nuestras Modelos',
      title: 'Belleza',
      titleHighlight: 'Elite',
      subtitle: 'Modelos exclusivas disponibles para ti',
      available: 'Disponible',
      unavailable: 'No Disponible',
      yearsOld: 'años',
      reserve: 'Reservar',
    },
    about: {
      badge: 'Sobre Nosotros',
      title: 'Black Diamond',
      titleHighlight: 'Studios',
    },
    contact: {
      badge: 'Contacto',
      title: 'Contáctanos',
      titleHighlight: 'Ahora',
      subtitle: 'Estamos aquí para atenderte',
      consult: 'Consultar',
      reserveWith: 'Reservar con',
    },
  },
  en: {
    nav: {
      home: 'Home',
      services: 'Services',
      models: 'Our Models',
      about: 'About',
      contact: 'Contact',
      login: 'Sign In',
      systemAccess: 'System Access',
    },
    hero: {
      liveStream: 'Live Stream',
      exclusiveModel: 'Exclusive Model',
    },
    services: {
      badge: 'Exclusive Services',
      title: 'Unique',
      titleHighlight: 'Experiences',
      subtitle: 'Premium services designed for your maximum pleasure',
    },
    models: {
      badge: 'Our Models',
      title: 'Elite',
      titleHighlight: 'Beauty',
      subtitle: 'Exclusive models available for you',
      available: 'Available',
      unavailable: 'Unavailable',
      yearsOld: 'years old',
      reserve: 'Reserve',
    },
    about: {
      badge: 'About Us',
      title: 'Black Diamond',
      titleHighlight: 'Studios',
    },
    contact: {
      badge: 'Contact',
      title: 'Contact',
      titleHighlight: 'Us',
      subtitle: 'We are here to serve you',
      consult: 'Consult',
      reserveWith: 'Reserve with',
    },
  },
  fr: {
    nav: {
      home: 'Accueil',
      services: 'Services',
      models: 'Nos Modèles',
      about: 'À Propos',
      contact: 'Contact',
      login: 'Se Connecter',
      systemAccess: 'Accès Système',
    },
    hero: {
      liveStream: 'Stream en Direct',
      exclusiveModel: 'Modèle Exclusive',
    },
    services: {
      badge: 'Services Exclusifs',
      title: 'Expériences',
      titleHighlight: 'Uniques',
      subtitle: 'Services premium conçus pour votre plaisir maximal',
    },
    models: {
      badge: 'Nos Modèles',
      title: 'Beauté',
      titleHighlight: 'Élite',
      subtitle: 'Modèles exclusives disponibles pour vous',
      available: 'Disponible',
      unavailable: 'Indisponible',
      yearsOld: 'ans',
      reserve: 'Réserver',
    },
    about: {
      badge: 'À Propos',
      title: 'Black Diamond',
      titleHighlight: 'Studios',
    },
    contact: {
      badge: 'Contact',
      title: 'Contactez',
      titleHighlight: 'Nous',
      subtitle: 'Nous sommes là pour vous servir',
      consult: 'Consulter',
      reserveWith: 'Réserver avec',
    },
  },
  pt: {
    nav: {
      home: 'Início',
      services: 'Serviços',
      models: 'Nossas Modelos',
      about: 'Sobre',
      contact: 'Contato',
      login: 'Entrar',
      systemAccess: 'Acesso ao Sistema',
    },
    hero: {
      liveStream: 'Stream ao Vivo',
      exclusiveModel: 'Modelo Exclusiva',
    },
    services: {
      badge: 'Serviços Exclusivos',
      title: 'Experiências',
      titleHighlight: 'Únicas',
      subtitle: 'Serviços premium projetados para seu máximo prazer',
    },
    models: {
      badge: 'Nossas Modelos',
      title: 'Beleza',
      titleHighlight: 'Elite',
      subtitle: 'Modelos exclusivas disponíveis para você',
      available: 'Disponível',
      unavailable: 'Indisponível',
      yearsOld: 'anos',
      reserve: 'Reservar',
    },
    about: {
      badge: 'Sobre Nós',
      title: 'Black Diamond',
      titleHighlight: 'Studios',
    },
    contact: {
      badge: 'Contato',
      title: 'Entre em',
      titleHighlight: 'Contato',
      subtitle: 'Estamos aqui para atendê-lo',
      consult: 'Consultar',
      reserveWith: 'Reservar com',
    },
  },
};
