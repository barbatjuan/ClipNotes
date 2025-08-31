import { useState, useRef } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ClipboardIcon, TrashIcon, ArrowDownTrayIcon, LinkIcon } from "@heroicons/react/24/outline";

export default function EditableJobCard({ job, onShare, onDownloadPDF, onDelete, onUpdateTitle }: any) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(job.title || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  const handleBlur = () => {
    setEditing(false);
    if (title !== job.title) {
      onUpdateTitle(title);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditing(false);
      if (title !== job.title) {
        onUpdateTitle(title);
      }
    }
    if (e.key === 'Escape') {
      setEditing(false);
      setTitle(job.title || '');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 flex flex-col gap-2 border border-gray-100 relative">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {job.status === 'completed' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircleIcon className="h-4 w-4 mr-1" /> Listo</span>
        ) : job.status === 'failed' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><XCircleIcon className="h-4 w-4 mr-1" /> Error</span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"><ClockIcon className="h-4 w-4 mr-1" /> Procesando</span>
        )}
        {editing ? (
          <input
            ref={inputRef}
            className="ml-2 text-xs font-semibold border-b border-primary focus:outline-none focus:border-blue-600 px-1 py-0.5"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={80}
            style={{ minWidth: 80, maxWidth: 200 }}
          />
        ) : (
          <span
            className="ml-2 truncate text-xs text-gray-700 font-semibold cursor-pointer hover:underline"
            title={title || job.input_url}
            onClick={handleEdit}
          >
            {title || 'Sin título'}
          </span>
        )}
        {job.audio_duration && (
          <span className="ml-2 text-xs text-blue-500">Duración: {job.audio_duration} seg</span>
        )}
        <button onClick={() => onShare(job)} title="Copiar enlace" className="ml-2 text-xs text-blue-600 hover:underline flex items-center"><LinkIcon className="h-4 w-4 mr-1" /></button>
        <button onClick={() => onDownloadPDF(job)} title="Descargar PDF" className="ml-2 text-xs text-green-600 hover:underline flex items-center"><ArrowDownTrayIcon className="h-4 w-4 mr-1" /></button>
        <button onClick={() => onDelete(job.id)} title="Eliminar" className="ml-2 text-xs text-red-600 hover:underline flex items-center"><TrashIcon className="h-4 w-4 mr-1" /></button>
        <span className="ml-auto text-xs text-gray-400">{new Date(job.created_at).toLocaleString()}</span>
      </div>
      {job.status === 'completed' && job.ai_summary && (
        <details className="bg-gray-50 rounded p-3 mt-2 relative group">
          <summary className="font-semibold mb-1 flex items-center justify-between cursor-pointer select-none">
            <span>Resumen</span>
            <span className="flex gap-2">
              <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(job.ai_summary); }} className="ml-2 text-xs text-primary hover:underline flex items-center"><ClipboardIcon className="h-4 w-4 mr-1" /> Copiar</button>
            </span>
          </summary>
          <div className="whitespace-pre-line text-gray-700 text-sm mt-2">{job.ai_summary}</div>
        </details>
      )}
      {job.status === 'completed' && job.raw_transcription && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-gray-500">Ver transcripción</summary>
          <div className="whitespace-pre-line text-xs text-gray-400 mt-1">{job.raw_transcription}</div>
        </details>
      )}
      {job.status === 'failed' && (
        <div className="text-red-500 text-sm">Error al procesar el video.</div>
      )}
      {(job.status === 'pending' || job.status === 'processing') && (
        <div className="flex flex-col gap-1">
          <div className="text-yellow-600 text-sm flex items-center gap-2">
            Procesando... (puede tardar unos minutos)
            {typeof job.progress === 'number' && (
              <span className="ml-2 text-xs text-gray-500">{job.progress}%</span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300 animate-pulse"
              style={{ width: `${job.progress || 0}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
