'use client';

import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import i18n from '@/lib/i18n';

export default function LanguageSelector() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  // Usar un estado local para el idioma actual, inicializado con español
  const [currentLangCode, setCurrentLangCode] = useState('es');

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];
  
  // Inicializar el estado local con el idioma actual de i18n o español por defecto
  useEffect(() => {
    // Solo establecer español como predeterminado en la primera carga
    if (!localStorage.getItem('i18nextLng')) {
      i18n.changeLanguage('es');
    }
    // Sincronizar el estado con i18n
    setCurrentLangCode(i18n.language || 'es');
  }, []);
  
  // Escuchar cambios en el idioma de i18n
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLangCode(lng);
    };
    
    // Agregar listener para cambios de idioma
    i18n.on('languageChanged', handleLanguageChanged);
    
    // Limpiar listener al desmontar
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  // Siempre usar el estado local para renderizar
  const currentLanguage = languages.find(lang => lang.code === currentLangCode) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setCurrentLangCode(langCode); // Actualizar también el estado local
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span>{currentLanguage.name}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg z-20">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors ${
                  currentLangCode === language.code 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' 
                    : 'text-secondary-700 dark:text-secondary-300'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {currentLangCode === language.code && (
                  <span className="ml-auto text-primary-600 dark:text-primary-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
