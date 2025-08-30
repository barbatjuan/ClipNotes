"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getUserJobs } from "@/lib/supabase/jobs";
import { CheckCircleIcon, ClockIcon, XCircleIcon, ClipboardIcon, TrashIcon, ArrowDownTrayIcon, LinkIcon } from "@heroicons/react/24/outline";
import jsPDF from "jspdf";
import Header from "@/components/layout/Header";
import { UploadInput } from "@/components/UploadInput";
import { SummaryDisplay } from "@/components/SummaryDisplay";


export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{error?: string, success?: string, loading?: boolean}>({});

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    fetchUser();
  }, []);

  const fetchJobs = async (uid: string) => {
    setLoading(true);
    try {
      const jobs = await getUserJobs(uid);
      setJobs(jobs);
    } finally {
      setLoading(false);
    }
  };


  // Polling automático para refrescar jobs cada 5s si hay jobs en proceso
  useEffect(() => {
    if (!user) return;
    fetchJobs(user.id);
    const interval = setInterval(() => {
      if (jobs.some(j => j.status === 'pending' || j.status === 'processing')) {
        fetchJobs(user.id);
      }
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [user, jobs]);
  // Eliminar job
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este resumen?')) return;
    await supabase.from('jobs').delete().eq('id', jobId);
    fetchJobs(user.id);
  };

  // Descargar resumen/transcripción en PDF
  const handleDownloadPDF = (job: any) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Resumen ClipNotes', 10, 15);
    doc.setFontSize(12);
    doc.text(`Enlace: ${job.input_url}`, 10, 25);
    if (job.audio_duration) doc.text(`Duración: ${job.audio_duration} segundos`, 10, 32);
    doc.text('Fecha:', 10, 39);
    doc.text(new Date(job.created_at).toLocaleString(), 30, 39);
    doc.setFontSize(14);
    doc.text('Resumen:', 10, 50);
    doc.setFontSize(12);
    doc.text(job.ai_summary || 'Sin resumen', 10, 58, { maxWidth: 180 });
    if (job.raw_transcription) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Transcripción:', 10, 15);
      doc.setFontSize(10);
      doc.text(job.raw_transcription, 10, 23, { maxWidth: 180 });
    }
    doc.save(`clipnotes_${job.id}.pdf`);
  };

  // Compartir link del resumen
  const handleShare = (job: any) => {
    navigator.clipboard.writeText(job.input_url);
    setFeedback({ success: '¡Enlace copiado al portapapeles!' });
    setTimeout(() => setFeedback({}), 2000);
  };

  // Encolar nuevo job desde dashboard
  const handleUpload = async (file: File) => {
    setFeedback({ loading: true });
    setTimeout(() => setFeedback({ error: 'La subida de archivos aún no está implementada. Usa un link público.' }), 500);
    setFeedback({ loading: false });
  };
  const handlePasteLink = async (url: string) => {
    setFeedback({ loading: true });
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al encolar el resumen');
      setFeedback({ success: '¡Tu video está encolado! El resumen aparecerá aquí cuando esté listo.' });
      fetchJobs(user.id);
    } catch (e: any) {
      setFeedback({ error: e.message || 'Ocurrió un error al procesar el contenido.' });
    } finally {
      setFeedback(f => ({ ...f, loading: false }));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setFeedback({ success: '¡Resumen copiado al portapapeles!' });
    setTimeout(() => setFeedback({}), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Header />
        <div className="mt-10 text-lg text-gray-600">Debes iniciar sesión para ver tu dashboard.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-4xl font-extrabold mb-4 text-primary drop-shadow">Dashboard</h1>
        <p className="mb-8 text-gray-600 text-lg">Pega el link de tu video o audio para generar un resumen con IA. También puedes ver tu historial y estadísticas.</p>
        <div className="mb-8">
          <UploadInput
            onUpload={handleUpload}
            onPasteLink={handlePasteLink}
            loading={feedback.loading}
            error={feedback.error}
            success={feedback.success}
            disabled={feedback.loading}
          />
        </div>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Historial de Resúmenes</h2>
          {loading && jobs.length === 0 ? (
            <div className="text-gray-500">Cargando...</div>
          ) : jobs.length === 0 ? (
            <div className="text-gray-400">No tienes resúmenes procesados aún.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {jobs.map(job => (
                <div key={job.id} className="bg-white rounded-xl shadow-lg p-5 flex flex-col gap-2 border border-gray-100 relative">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {job.status === 'completed' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircleIcon className="h-4 w-4 mr-1" /> Listo</span>
                    ) : job.status === 'failed' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><XCircleIcon className="h-4 w-4 mr-1" /> Error</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"><ClockIcon className="h-4 w-4 mr-1" /> Procesando</span>
                    )}
                    <span className="ml-2 truncate text-xs text-gray-500" title={job.input_url}>{job.input_url}</span>
                    {job.audio_duration && (
                      <span className="ml-2 text-xs text-blue-500">Duración: {job.audio_duration} seg</span>
                    )}
                    <button onClick={() => handleShare(job)} title="Copiar enlace" className="ml-2 text-xs text-blue-600 hover:underline flex items-center"><LinkIcon className="h-4 w-4 mr-1" /></button>
                    <button onClick={() => handleDownloadPDF(job)} title="Descargar PDF" className="ml-2 text-xs text-green-600 hover:underline flex items-center"><ArrowDownTrayIcon className="h-4 w-4 mr-1" /></button>
                    <button onClick={() => handleDeleteJob(job.id)} title="Eliminar" className="ml-2 text-xs text-red-600 hover:underline flex items-center"><TrashIcon className="h-4 w-4 mr-1" /></button>
                    <span className="ml-auto text-xs text-gray-400">{new Date(job.created_at).toLocaleString()}</span>
                  </div>
                  {job.status === 'completed' && job.ai_summary && (
                    <details className="bg-gray-50 rounded p-3 mt-2 relative group">
                      <summary className="font-semibold mb-1 flex items-center justify-between cursor-pointer select-none">
                        <span>Resumen</span>
                        <span className="flex gap-2">
                          <button onClick={e => { e.stopPropagation(); handleCopy(job.ai_summary); }} className="ml-2 text-xs text-primary hover:underline flex items-center"><ClipboardIcon className="h-4 w-4 mr-1" /> Copiar</button>
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
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-4">Estadísticas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <div className="text-3xl font-bold text-primary">{jobs.length}</div>
              <div className="text-gray-500">Total</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <div className="text-3xl font-bold text-green-600">{jobs.filter(j => j.status === 'completed').length}</div>
              <div className="text-gray-500">Completados</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <div className="text-3xl font-bold text-yellow-500">{jobs.filter(j => j.status === 'pending').length}</div>
              <div className="text-gray-500">Pendientes</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <div className="text-3xl font-bold text-red-500">{jobs.filter(j => j.status === 'failed').length}</div>
              <div className="text-gray-500">Errores</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
