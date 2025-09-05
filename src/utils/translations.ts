export const translations = {
  es: {
    // Common
    login: "Iniciar sesión",
    signup: "Registrarse", 
    logout: "Cerrar sesión",
    settings: "Ajustes",
    profile: "Perfil",
    save: "Guardar",
    cancel: "Cancelar",
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    
    // Navigation
    dashboard: "Dashboard",
    statistics: "Estadísticas",
    history: "Historial",
    
    // Settings
    settingsTitle: "Configuración",
    language: "Idioma",
    appearance: "Apariencia",
    summaryStyle: "Estilo de resumen predeterminado",
    saveChanges: "Guardar cambios",
    savePreferences: "Guardar preferencias",
    
    // Language options
    spanish: "Español",
    english: "Inglés",
    
    // Summary styles
    executive: "Ejecutivo",
    bullet: "Puntos clave",
    detailed: "Resumen detallado",
    
    // Landing page
    heroTitle: "Tus {type} grabadas, Convertidas en Notas Perfectas",
    heroSubtitle: "Pega un link o sube un archivo de Zoom, Meet o Loom. Transcripción y resumen al instante.",
    howItWorks: "Cómo funciona",
    pricing: "Planes y precios",
    faq: "Preguntas frecuentes",
    
    // Pricing
    pricingSubtitle: "Elige el plan que se adapta a tus necesidades. Sin plan gratis, sin sorpresas.",
    starter: "Starter",
    premium: "Premium", 
    enterprise: "Enterprise",
    popular: "POPULAR",
    chooseStarter: "Elegir Starter",
    choosePremium: "Elegir Premium",
    chooseEnterprise: "Elegir Enterprise",
    
    // Features
    minutesProcessing: "{minutes} minutos de procesamiento al mes",
    aiSummaries: "Resúmenes con IA",
    advancedSummaries: "Resúmenes avanzados con IA",
    historyDays: "Historial de {days} días",
    unlimitedHistory: "Historial ilimitado",
    prioritySupport: "Soporte prioritario",
    autoTranslation: "Traducción automática de resúmenes",
    emailSummaries: "Envío de resúmenes por correo automático",
    
    // Messages
    profileUpdated: "Perfil actualizado correctamente",
    errorUpdatingProfile: "Error al actualizar el perfil",
    welcomeMessage: "¡Bienvenido! Ya puedes generar tus resúmenes.",
    loginRequired: "Inicia sesión o crea una cuenta para usar el generador de resúmenes."
  },
  
  en: {
    // Common
    login: "Login",
    signup: "Sign Up",
    logout: "Logout", 
    settings: "Settings",
    profile: "Profile",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    
    // Navigation
    dashboard: "Dashboard",
    statistics: "Statistics", 
    history: "History",
    
    // Settings
    settingsTitle: "Settings",
    language: "Language",
    appearance: "Appearance",
    summaryStyle: "Default Summary Style",
    saveChanges: "Save Changes",
    savePreferences: "Save Preferences",
    
    // Language options
    spanish: "Spanish",
    english: "English",
    
    // Summary styles
    executive: "Executive",
    bullet: "Bullet Points",
    detailed: "Detailed Summary",
    
    // Landing page
    heroTitle: "Your recorded {type}, Converted into Perfect Notes",
    heroSubtitle: "Paste a link or upload a Zoom, Meet or Loom file. Instant transcription and summary.",
    howItWorks: "How it works",
    pricing: "Plans and pricing",
    faq: "Frequently asked questions",
    
    // Pricing
    pricingSubtitle: "Choose the plan that fits your needs. No free plan, no surprises.",
    starter: "Starter",
    premium: "Premium",
    enterprise: "Enterprise", 
    popular: "POPULAR",
    chooseStarter: "Choose Starter",
    choosePremium: "Choose Premium",
    chooseEnterprise: "Choose Enterprise",
    
    // Features
    minutesProcessing: "{minutes} minutes of processing per month",
    aiSummaries: "AI Summaries",
    advancedSummaries: "Advanced AI Summaries",
    historyDays: "{days} days history",
    unlimitedHistory: "Unlimited history",
    prioritySupport: "Priority support",
    autoTranslation: "Automatic summary translation",
    emailSummaries: "Automatic email summaries",
    
    // Messages
    profileUpdated: "Profile updated successfully",
    errorUpdatingProfile: "Error updating profile",
    welcomeMessage: "Welcome! You can now generate your summaries.",
    loginRequired: "Login or create an account to use the summary generator."
  }
};

export type Language = 'es' | 'en';
export type TranslationKey = keyof typeof translations.es;
