import React from 'react';


interface UploadProps {
  onUpload: (file: File, title?: string) => void;
  onPasteLink: (url: string, title?: string) => void;
  loading?: boolean;
  error?: string;
  success?: string;
  disabled?: boolean;
  showTitleInput?: boolean;
  userProfile?: {
    plan_tier: string;
    monthly_minutes_limit: number;
    minutes_processed_current_month: number;
  };
}


export const UploadInput: React.FC<UploadProps> = ({ onUpload, onPasteLink, loading, error, success, disabled, showTitleInput, userProfile }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [url, setUrl] = React.useState('');
  const [title, setTitle] = React.useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0], showTitleInput ? title : undefined);
    }
  };

  const handlePasteLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      onPasteLink(url, showTitleInput ? title : undefined);
    }
  };

  // Calculate remaining minutes and warning thresholds
  const getRemainingMinutes = () => {
    if (!userProfile) return null;
    const usedMinutes = Math.ceil((userProfile.minutes_processed_current_month || 0) / 60);
    const limitMinutes = userProfile.monthly_minutes_limit || 10;
    return Math.max(limitMinutes - usedMinutes, 0);
  };

  const shouldShowWarning = () => {
    if (!userProfile) return false;
    const remainingMinutes = getRemainingMinutes();
    if (remainingMinutes === null) return false;

    const planTier = userProfile.plan_tier;
    if (planTier === 'starter') return remainingMinutes < 15;
    if (planTier === 'premium' || planTier === 'pro') return remainingMinutes < 30;
    if (planTier === 'enterprise') return remainingMinutes < 60;
    return false;
  };

  const getWarningMessage = () => {
    const remainingMinutes = getRemainingMinutes();
    const planTier = userProfile?.plan_tier;
    let planName = '';
    if (planTier === 'starter') planName = 'Starter';
    else if (planTier === 'pro') planName = 'Premium';
    else if (planTier) planName = planTier.charAt(0).toUpperCase() + planTier.slice(1);
    
    return `⚠️ Te quedan solo ${remainingMinutes} minutos en tu plan ${planName}. Considera actualizar tu plan para continuar procesando videos.`;
  };

  return (
    <div className="w-full">
      <div className="space-y-4">
        <div>
          <form onSubmit={handlePasteLink} className="flex gap-3">
            {showTitleInput && (
              <input
                type="text"
                placeholder="Título del resumen (opcional)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input w-80"
                aria-label="Título del resumen"
                disabled={disabled}
              />
            )}
            <input
              type="url"
              placeholder="Pega tu enlace de YouTube, Loom, Meet, Vimeo, etc."
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="flex-1 input placeholder-secondary-500 dark:placeholder-secondary-400 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              aria-label="Pegar enlace de video"
              disabled={disabled}
            />
            <button type="submit" className="btn btn-primary whitespace-nowrap px-5 md:px-6 py-3 text-base font-semibold transition-transform hover:scale-[1.02]" disabled={loading || disabled}>
              {loading ? 'Procesando...' : 'Resumir'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Warning message for low minutes */}
      {shouldShowWarning() && (
        <div className="mt-4 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
          <div className="text-warning-800 dark:text-warning-200 text-sm font-medium">
            {getWarningMessage()}
          </div>
        </div>
      )}
      
      {/* Mensajes de estado */}
      {(error || success) && (
        <div className="mt-4 text-center">
          {error && <div className="text-danger-600 dark:text-danger-400 text-sm font-medium">{error}</div>}
          {success && <div className="text-success-700 dark:text-success-400 text-sm font-medium">{success}</div>}
        </div>
      )}
    </div>
  );
};
