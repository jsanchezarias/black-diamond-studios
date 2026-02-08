import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Language, translations, Translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Obtener idioma guardado o usar español por defecto
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'es';
  });

  const setLanguage = (lang: Language) => {
    console.log('🌐 LanguageContext: Cambiando idioma de', language, 'a', lang);
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Debug: log cuando cambia el idioma
  useEffect(() => {
    console.log('✅ LanguageContext: Idioma actualizado a', language);
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    console.warn('useLanguage must be used within LanguageProvider');
    return undefined;
  }
  return context;
}