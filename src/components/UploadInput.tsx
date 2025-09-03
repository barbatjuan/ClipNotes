import React from 'react';


interface UploadProps {
  onUpload: (file: File, title?: string) => void;
  onPasteLink: (url: string, title?: string) => void;
  loading?: boolean;
  error?: string;
  success?: string;
  disabled?: boolean;
  showTitleInput?: boolean;
}


export const UploadInput: React.FC<UploadProps> = ({ onUpload, onPasteLink, loading, error, success, disabled, showTitleInput }) => {
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
