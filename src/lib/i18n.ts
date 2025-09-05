import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traducciones directamente
import esTranslations from '../locales/es.json';
import enTranslations from '../locales/en.json';

// Definición de recursos
const resources = {
  es: {
    translation: esTranslations
  },
  en: {
    translation: enTranslations
  }
};

// Singleton para evitar múltiples inicializaciones
let isInitialized = false;

const initI18n = () => {
  if (isInitialized) return i18n;
  
  isInitialized = true;
  
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'es',
      defaultNS: 'translation',
      
      interpolation: {
        escapeValue: false,
      },
      
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
      
      react: {
        useSuspense: false,
      },
    });
    
  return i18n;
};

// Inicializar i18n
initI18n();

// Helper para cambiar idioma
export const changeLanguage = async (lang: string): Promise<void> => {
  try {
    await i18n.changeLanguage(lang);
  } catch (error) {
    console.error('Error al cambiar el idioma:', error);
  }
};

export default i18n;
