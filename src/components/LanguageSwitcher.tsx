"use client";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const LanguageSwitcher = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLangCode, setCurrentLangCode] = useState('es');
  const [isClient, setIsClient] = useState(false);

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  // Evitar hidratación mismatch
  useEffect(() => {
    setIsClient(true);
    // Solo establecer español como predeterminado en la primera carga
    if (!localStorage.getItem('i18nextLng')) {
      i18n.changeLanguage('es');
    }
    setCurrentLangCode(i18n.language || 'es');
  }, []);

  // Escuchar cambios en el idioma de i18n
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLangCode(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  // No renderizar hasta que esté en el cliente para evitar hidratación mismatch
  if (!isClient) {
    return (
      <div className="relative">
        <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <GlobeAltIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Español</span>
          <span className="sm:hidden">🇪🇸</span>
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const currentLanguage = languages.find(lang => lang.code === currentLangCode) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setCurrentLangCode(lng);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <GlobeAltIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <span className="sm:hidden">{currentLanguage.flag}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 ${
                currentLanguage.code === language.code
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
