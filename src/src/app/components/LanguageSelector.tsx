import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useLanguage } from './LanguageContext';
import { Language } from './translations';

const languages = [
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'pt' as Language, name: 'Português', flag: '🇧🇷' },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (lang: Language) => {
    console.log('🌐 LanguageSelector: Cambiando idioma a:', lang);
    console.log('🌐 LanguageSelector: Idioma actual antes del cambio:', language);
    setLanguage(lang);
    setIsOpen(false);
    
    setTimeout(() => {
      console.log('✅ LanguageSelector: Idioma cambiado, verificando actualización');
    }, 100);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="border-primary/30 hover:bg-primary/10 gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 flex-shrink-0"
      >
        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
        {/* Desktop: nombre completo */}
        <span className="hidden xl:inline text-xs xl:text-sm whitespace-nowrap">{currentLanguage.flag} {currentLanguage.name}</span>
        {/* Tablet: solo código */}
        <span className="hidden lg:inline xl:hidden text-xs whitespace-nowrap">{currentLanguage.flag} {currentLanguage.code.toUpperCase()}</span>
        {/* Móvil: solo bandera */}
        <span className="lg:hidden text-base sm:text-lg">{currentLanguage.flag}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 sm:w-48 bg-card border border-primary/20 rounded-lg shadow-xl shadow-primary/10 overflow-hidden z-[60]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-primary/10 transition-colors flex items-center gap-2 sm:gap-3 ${
                language === lang.code ? 'bg-primary/20 text-primary' : ''
              }`}
            >
              <span className="text-xl sm:text-2xl flex-shrink-0">{lang.flag}</span>
              <span className="font-medium text-xs sm:text-sm truncate">{lang.name}</span>
              {language === lang.code && (
                <span className="ml-auto text-primary flex-shrink-0">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}