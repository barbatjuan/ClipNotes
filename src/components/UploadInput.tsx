import React from 'react';

interface UploadProps {
  onUpload: (file: File) => void;
  onPasteLink: (url: string) => void;
  loading?: boolean;
  error?: string;
  success?: string;
  disabled?: boolean;
}

export const UploadInput: React.FC<UploadProps> = ({ onUpload, onPasteLink, loading, error, success, disabled }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [url, setUrl] = React.useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handlePasteLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      onPasteLink(url);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      <label className="block text-sm font-medium">Sube un archivo de audio/video</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/*"
        className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-indigo-700"
        onChange={handleFileChange}
        aria-label="Subir archivo"
        disabled={disabled}
      />
      <form onSubmit={handlePasteLink} className="flex gap-2">
        <input
          type="url"
          placeholder="Pega un link de YouTube, Vimeo, etc."
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          aria-label="Pegar link"
          disabled={disabled}
        />
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded" disabled={loading || disabled}>
          {loading ? 'Procesando...' : 'Resumir'}
        </button>
      </form>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
    </div>
  );
};
