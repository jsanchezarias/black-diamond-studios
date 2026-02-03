import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Button } from './ui/button';
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
    console.log('🌐 LanguageSelector: Cambiando idioma a:', lang); // Debug
    console.log('🌐 LanguageSelector: Idioma actual antes del cambio:', language); // Debug
    setLanguage(lang);
    setIsOpen(false);
    
    // Forzar re-render después de un pequeño delay
    setTimeout(() => {
      console.log('✅ LanguageSelector: Idioma cambiado, verificando actualización'); // Debug
    }, 100);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="border-primary/30 hover:bg-primary/10 gap-2"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden md:inline">{currentLanguage.flag} {currentLanguage.name}</span>
        <span className="md:hidden">{currentLanguage.flag}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-primary/20 rounded-lg shadow-xl shadow-primary/10 overflow-hidden z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors flex items-center gap-3 ${
                language === lang.code ? 'bg-primary/20 text-primary' : ''
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
              {language === lang.code && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
