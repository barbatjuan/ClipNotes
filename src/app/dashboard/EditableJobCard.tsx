import { useState, useRef, useEffect } from 'react';
import { SanitizedHTML } from '@/components/SanitizedHTML';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ClipboardIcon, TrashIcon, ArrowDownTrayIcon, LinkIcon, EllipsisVerticalIcon, EnvelopeIcon } from "@heroicons/react/24/outline";


export default function EditableJobCard({ job, onShare, onDownloadPDF, onDelete, onUpdateTitle }: any) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(job.title || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close menu on outside click
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(ev.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const handleEmail = () => {
    const subject = encodeURIComponent(`Resumen ClipNotes: ${title || 'Sin título'}`);
    const body = encodeURIComponent(`Hola,%0D%0A%0D%0ATe comparto el resumen:%0D%0A${job.input_url}%0D%0A%0D%0ASaludos.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="section-card p-5 flex flex-col gap-3 relative">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        {job.status === 'completed' ? (
          <span className="badge badge-success text-xs inline-flex items-center"><CheckCircleIcon className="h-4 w-4 mr-1" /> Listo</span>
        ) : job.status === 'failed' ? (
          <span className="badge badge-danger text-xs inline-flex items-center"><XCircleIcon className="h-4 w-4 mr-1" /> Error</span>
        ) : (
          <span className="badge badge-warning text-xs inline-flex items-center"><ClockIcon className="h-4 w-4 mr-1" /> Procesando</span>
        )}
        {editing ? (
          <input
            ref={inputRef}
            className="ml-2 text-xs font-semibold bg-transparent border-b border-primary-400 dark:border-primary-500 focus:outline-none focus:border-primary-600 px-1 py-0.5 text-secondary-800 dark:text-secondary-100"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={80}
            style={{ minWidth: 80, maxWidth: 200 }}
          />
        ) : (
          <span
            className="ml-2 truncate text-xs text-secondary-700 dark:text-secondary-200 font-semibold cursor-pointer hover:underline"
            title={title || job.input_url}
            onClick={handleEdit}
          >
            {title || 'Sin título'}
          </span>
        )}
        {job.audio_duration && (
          <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">Duración: {job.audio_duration} seg</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-secondary-500 dark:text-secondary-400">{new Date(job.created_at).toLocaleDateString()}</span>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
              className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-secondary-300 dark:border-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition"
              title="Acciones"
            >
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 mt-2 z-20 min-w-[200px] rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white/90 dark:bg-secondary-900/90 backdrop-blur shadow-lg p-1">
                <button role="menuitem" onClick={() => { onShare(job); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <LinkIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" /> Copiar enlace
                </button>
                <button role="menuitem" onClick={() => { onDownloadPDF(job); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <ArrowDownTrayIcon className="h-4 w-4 text-success-600 dark:text-success-400" /> Descargar PDF
                </button>
                <button role="menuitem" onClick={() => { handleEmail(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <EnvelopeIcon className="h-4 w-4 text-accent-600 dark:text-accent-400" /> Enviar por correo
                </button>
                <button role="menuitem" onClick={() => { router.push(`/jobs/${job.id}`); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                  <ClipboardIcon className="h-4 w-4 text-secondary-600 dark:text-secondary-300" /> Abrir
                </button>
                <div className="my-1 h-px bg-secondary-200 dark:bg-secondary-800" />
                <button role="menuitem" onClick={() => { onDelete(job.id); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-danger-700 dark:text-danger-400 hover:bg-danger-50/60 dark:hover:bg-danger-900/30">
                  <TrashIcon className="h-4 w-4" /> Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
  {job.status === 'completed' && job.ai_summary && (
        <details className="mt-1 bg-secondary-50 dark:bg-secondary-900/60 border border-secondary-200 dark:border-secondary-800 rounded-xl p-3 relative">
          <summary className="font-semibold mb-1 flex items-center justify-between cursor-pointer select-none text-secondary-800 dark:text-secondary-100">
            <span>Resumen</span>
            <span className="flex gap-2">
              <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(job.ai_summary); }} className="ml-2 text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center"><ClipboardIcon className="h-4 w-4 mr-1" /> Copiar</button>
            </span>
          </summary>
          <pre className="whitespace-pre-wrap font-mono text-sm mt-2">{job.ai_summary}</pre>
        </details>
      )}
      {job.status === 'completed' && job.raw_transcription && (
        <details className="mt-1">
          <summary className="cursor-pointer text-xs text-secondary-600 dark:text-secondary-300">Ver transcripción</summary>
          <div className="whitespace-pre-line text-xs text-secondary-500 dark:text-secondary-300 mt-1 max-h-48 overflow-auto">{job.raw_transcription}</div>
        </details>
      )}
      {job.status === 'failed' && (
        <div className="text-danger-600 dark:text-danger-400 text-sm">Error al procesar el video.</div>
      )}
      {(job.status === 'pending' || job.status === 'processing') && (
        <div className="flex flex-col gap-1">
          <div className="text-warning-600 dark:text-warning-400 text-sm flex items-center gap-2">
            Procesando... (puede tardar unos minutos)
            {typeof job.progress === 'number' && (
              <span className="ml-2 text-xs text-secondary-500 dark:text-secondary-400">{job.progress}%</span>
            )}
          </div>
          <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-warning-500 to-warning-600 h-2 rounded-full transition-all duration-300 animate-pulse"
              style={{ width: `${job.progress || 0}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
