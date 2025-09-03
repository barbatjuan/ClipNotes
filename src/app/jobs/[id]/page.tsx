"use client";

import { useEffect, useState, useMemo } from "react";
import { SanitizedHTML } from '@/components/SanitizedHTML';
import { useParams, useRouter } from "next/navigation";
import { getJobById, getUserJobs } from "@/lib/supabase/jobs";
import { supabase } from "@/lib/supabase/client";
import jsPDF from "jspdf";
import { ArrowLeftIcon, ClipboardIcon, ArrowDownTrayIcon, LinkIcon, TrashIcon, PaperAirplaneIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";

export default function JobDetailPage() {
  const params = useParams();
  const idParam = (params as any)?.id as string | string[] | undefined;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{success?: string; error?: string}>({});
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);

  useEffect(() => {
    const fetchJob = async (jid: string) => {
      try {
        setLoading(true);
        const data = await getJobById(jid);
        setJob(data);
      } catch (e: any) {
        setError(e?.message || "No se pudo cargar el archivo.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJob(id);
  }, [id]);

  // Polling cada 5s para actualizar progreso/estado hasta que termine
  useEffect(() => {
    if (!id) return;
    if (!job) return;
    if (job.status === 'completed' || job.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const data = await getJobById(id);
        setJob(data);
      } catch {
        // ignora errores de red temporales
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, job?.status]);

  

  // Cargar usuario y trabajos para Sidebar
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) {
        const list = await getUserJobs(u.id);
        setJobs(list);
      }
    };
    load();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setFeedback({ success: "Copiado al portapapeles" });
    setTimeout(() => setFeedback({}), 1500);
  };

  const handleDownloadPDF = (j: any) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(j.title || "Resumen ClipNotes", 10, 16);
    doc.setFontSize(11);
    if (j.input_url) doc.text(`Enlace: ${j.input_url}`, 10, 26);
    if (j.audio_duration) doc.text(`Duración: ${j.audio_duration} segundos`, 10, 34);
    doc.text(`Fecha: ${new Date(j.created_at).toLocaleString()}`, 10, 42);
    doc.setFontSize(14);
    doc.text("Resumen:", 10, 56);
    doc.setFontSize(11);
    doc.text(j.ai_summary || "Sin resumen", 10, 64, { maxWidth: 180 });
    if (j.raw_transcription) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Transcripción:", 10, 16);
      doc.setFontSize(10);
      doc.text(j.raw_transcription, 10, 24, { maxWidth: 180 });
    }
    doc.save(`clipnotes_${j.id}.pdf`);
  };

  const deleteJob = async () => {
    if (!job) return;
    setShowDeleteModal(false);
    await supabase.from("jobs").delete().eq("id", job.id);
    router.push("/dashboard");
  };

  const statusPill = useMemo(() => {
    if (!job) return null;
    const map: Record<string, { bg: string; text: string; label: string }> = {
      completed: { bg: "bg-success-100", text: "text-success-700", label: "Listo" },
      failed: { bg: "bg-danger-100", text: "text-danger-700", label: "Error" },
      pending: { bg: "bg-warning-100", text: "text-warning-800", label: "En cola" },
      processing: { bg: "bg-warning-100", text: "text-warning-800", label: "Procesando" },
    };
    const s = map[job.status] || map.pending;
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>;
  }, [job]);

  return (
    <>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-secondary-500 dark:text-secondary-400 mb-3">
          <ol className="flex items-center gap-2">
            <li><button onClick={() => router.push('/dashboard')} className="hover:underline text-secondary-600 dark:text-secondary-300">Dashboard</button></li>
            <li>/</li>
            <li><button onClick={() => router.push('/dashboard')} className="hover:underline text-secondary-600 dark:text-secondary-300">Historial</button></li>
            <li>/</li>
            <li className="text-secondary-800 dark:text-secondary-100 font-medium truncate max-w-[50vw]" title={job?.title || job?.input_url || 'Detalle'}>{job?.title || 'Detalle'}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="btn btn-ghost flex items-center gap-2">
            <ArrowLeftIcon className="w-5 h-5" /> Volver
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 dark:text-secondary-100">Detalle del Archivo</h1>
        </div>

        {/* Card */}
        <div className="section-card overflow-hidden">
          <div className="p-6 md:p-8 border-b border-secondary-200 dark:border-secondary-800 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {statusPill}
                {job?.audio_duration && (
                  <span className="text-sm text-primary-600 dark:text-primary-400 font-semibold">Duración: {job.audio_duration} seg</span>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-secondary-900 dark:text-secondary-100 truncate" title={job?.title || job?.input_url}>
                {job?.title || "Sin título"}
              </h2>
              <div className="text-sm text-secondary-500 dark:text-secondary-400 truncate">
                {job?.input_url}
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              {job?.input_url && (
                <button onClick={() => handleCopy(job.input_url)} className="btn btn-light flex items-center gap-2 transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100">
                  <LinkIcon className="w-4 h-4" /> Copiar
                </button>
              )}
              <button onClick={() => setShowEmailModal(true)} className="btn btn-light flex items-center gap-2 transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100">
                <PaperAirplaneIcon className="w-4 h-4" /> Enviar
              </button>
              <button onClick={() => job && handleDownloadPDF(job)} className="btn btn-primary flex items-center gap-2 transition-colors hover:bg-primary-600 dark:hover:bg-primary-500">
                <ArrowDownTrayIcon className="w-4 h-4" /> Descargar
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger-outline flex items-center gap-2 transition-colors hover:bg-danger-50 dark:hover:bg-danger-900/30">
                <TrashIcon className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Índice anclable */}
            <aside className="lg:col-span-1 order-last lg:order-first">
              <div className="sticky top-6 bg-secondary-50 dark:bg-secondary-900/50 border border-secondary-200 dark:border-secondary-700 rounded-xl p-4">
                <div className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 mb-2">Secciones</div>
                <ul className="space-y-1 text-sm">
                  <li><a href="#resumen" className="text-primary-700 dark:text-primary-400 hover:underline">Resumen</a></li>
                  <li><a href="#transcripcion" className="text-primary-700 dark:text-primary-400 hover:underline">Transcripción</a></li>
                </ul>
              </div>
            </aside>

            {/* Resumen */}
            <section id="resumen" className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-100 mb-3">Resumen</h3>
              {/* Barra de progreso mientras procesa */}
              {job && job.status !== 'completed' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-secondary-600 dark:text-secondary-300 mb-1">
                    <span>{job.status === 'failed' ? 'Error' : job.status === 'pending' ? 'En cola…' : 'Procesando…'}</span>
                    {typeof (job as any).progress === 'number' && (
                      <span className="font-semibold">{(job as any).progress}%</span>
                    )}
                  </div>
                  <div className="h-2 rounded-full bg-secondary-200 dark:bg-secondary-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r from-warning-400 to-warning-600 dark:from-warning-500 dark:to-warning-400 ${typeof (job as any).progress === 'number' ? '' : 'animate-pulse w-1/3'}`}
                      style={{ width: typeof (job as any).progress === 'number' ? `${(job as any).progress}%` : undefined }}
                    />
                  </div>
                </div>
              )}
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded" />
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-5/6" />
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-4/6" />
                </div>
              ) : job?.ai_summary ? (
                <pre className="whitespace-pre-wrap font-mono text-sm mt-2">{job.ai_summary}</pre>
              ) : (
                <div className="text-secondary-500 dark:text-secondary-400">Sin resumen disponible</div>
              )}
              {job?.ai_summary && (
                <button onClick={() => handleCopy(job.ai_summary)} className="mt-3 btn btn-ghost flex items-center gap-2">
                  <ClipboardIcon className="w-4 h-4" /> Copiar resumen
                </button>
              )}
            </section>

            {/* Sección de detalles removida por solicitud */}

            {/* Transcripción */}
            <section id="transcripcion" className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-100 mb-3">Transcripción</h3>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-3/4" />
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-2/3" />
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-800 rounded w-5/6" />
                </div>
              ) : job?.raw_transcription ? (
                <details open className="bg-white/80 dark:bg-secondary-900/50 backdrop-blur rounded-xl border border-secondary-200 dark:border-secondary-700 p-4">
                  <summary className="cursor-pointer select-none text-secondary-700 dark:text-secondary-200 font-medium">Ver transcripción</summary>
                  <pre className="mt-3 whitespace-pre-wrap text-sm text-secondary-700 dark:text-secondary-100">{job.raw_transcription}</pre>
                </details>
              ) : (
                <div className="text-secondary-500 dark:text-secondary-400">Sin transcripción</div>
              )}
            </section>
          </div>
        </div>

        {/* Acciones flotantes (menú) */}
        <div className="fixed right-6 bottom-6 z-20">
          <div className="relative">
            <button
              aria-label="Acciones"
              onClick={() => setFabMenuOpen(v => !v)}
              className="h-14 w-14 rounded-full bg-sky-500 text-white shadow-2xl flex items-center justify-center hover:bg-sky-600 focus:outline-none focus:ring-0 border-0"
            >
              <EllipsisVerticalIcon className="w-6 h-6" />
            </button>
            {fabMenuOpen && (
              <div className="absolute bottom-14 right-0 w-56 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white/90 dark:bg-secondary-900/80 backdrop-blur shadow-2xl overflow-hidden">
                <ul className="py-1 text-sm text-secondary-700 dark:text-secondary-200">
                  {job?.input_url && (
                    <li>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-secondary-50 dark:hover:bg-secondary-800 flex items-center gap-2"
                        onClick={() => { handleCopy(job.input_url!); setFabMenuOpen(false); }}
                      >
                        <LinkIcon className="w-4 h-4" /> Copiar enlace
                      </button>
                    </li>
                  )}
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-secondary-50 dark:hover:bg-secondary-800 flex items-center gap-2"
                      onClick={() => { setShowEmailModal(true); setFabMenuOpen(false); }}
                    >
                      <PaperAirplaneIcon className="w-4 h-4" /> Enviar correo
                    </button>
                  </li>
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-secondary-50 dark:hover:bg-secondary-800 flex items-center gap-2"
                      onClick={() => { if (job) handleDownloadPDF(job); setFabMenuOpen(false); }}
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" /> Descargar PDF
                    </button>
                  </li>
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-danger-50 dark:hover:bg-danger-900/30 text-danger-700 dark:text-danger-400 flex items-center gap-2"
                      onClick={() => { setShowDeleteModal(true); setFabMenuOpen(false); }}
                    >
                      <TrashIcon className="w-4 h-4" /> Eliminar
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Feedback */}
        {(feedback.success || error) && (
          <div className="mt-4">
            {feedback.success && (
              <div className="p-3 rounded-lg bg-success-50/80 dark:bg-success-900/30 border border-success-200/80 dark:border-success-700/40 text-success-700 dark:text-success-400 text-sm">{feedback.success}</div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-danger-50/80 dark:bg-danger-900/30 border border-danger-200/80 dark:border-danger-700/40 text-danger-700 dark:text-danger-400 text-sm">{error}</div>
            )}
          </div>
        )}

        {/* Modal de confirmación */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white/90 dark:bg-secondary-900/80 backdrop-blur rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700 w-full max-w-md p-6">
              <h4 className="text-lg font-bold text-secondary-900 dark:text-secondary-100 mb-2">Eliminar resumen</h4>
              <p className="text-secondary-600 dark:text-secondary-300 mb-6">Esta acción no se puede deshacer. ¿Deseas eliminar este resumen?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="btn btn-light">Cancelar</button>
                <button onClick={deleteJob} className="btn btn-danger">Eliminar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Enviar correo */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white/90 dark:bg-secondary-900/80 backdrop-blur rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700 w-full max-w-md p-6">
              <h4 className="text-lg font-bold text-secondary-900 dark:text-secondary-100 mb-2">Enviar por correo</h4>
              <p className="text-secondary-600 dark:text-secondary-300 mb-4">Envía el resumen y enlace del archivo por email.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="destinatario@correo.com"
                  className="input flex-1"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                />
                <button
                  disabled={sendingEmail || !emailTo}
                  onClick={async () => {
                    try {
                      setSendingEmail(true);
                      const res = await fetch('/api/send-summary', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          to: emailTo,
                          subject: `ClipNotes - ${job?.title || 'Resumen'}`,
                          title: job?.title,
                          summary: job?.ai_summary,
                          link: job?.input_url,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        // Fallback a mailto si no hay API key configurada o error similar
                        const msg = (data?.error || '').toString();
                        if (msg.toLowerCase().includes('resend') || msg.toLowerCase().includes('api')) {
                          const subject = encodeURIComponent(`ClipNotes - ${job?.title || 'Resumen'}`);
                          const body = encodeURIComponent(
                            `Título: ${job?.title || 'Sin título'}\n\nResumen:\n${job?.ai_summary || 'Sin resumen'}\n\nEnlace: ${job?.input_url || ''}`
                          );
                          window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
                          setFeedback({ success: 'Abriendo cliente de correo…' });
                          setTimeout(() => setFeedback({}), 2000);
                          setShowEmailModal(false);
                          return;
                        }
                        throw new Error(msg || 'No se pudo enviar el correo');
                      }
                      setFeedback({ success: 'Correo enviado ✅' });
                      setTimeout(() => setFeedback({}), 2000);
                      setShowEmailModal(false);
                    } catch (e: any) {
                      setFeedback({ error: e?.message || 'Error al enviar el correo' });
                      setTimeout(() => setFeedback({}), 2500);
                    } finally {
                      setSendingEmail(false);
                    }
                  }}
                  className="btn btn-primary"
                >
                  {sendingEmail ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => setShowEmailModal(false)} className="btn btn-light">Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
