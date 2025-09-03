"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { getUserJobs } from "@/lib/supabase/jobs";
import { CheckCircleIcon, ClockIcon, XCircleIcon, ClipboardIcon, TrashIcon, ArrowDownTrayIcon, LinkIcon } from "@heroicons/react/24/outline";
import EditableJobCard from "./EditableJobCard";
import jsPDF from "jspdf";
import Header from "@/components/layout/Header";
import { UploadInput } from "@/components/UploadInput";
import { SummaryDisplay } from "@/components/SummaryDisplay";

import { PaypalSubscribeButton } from "@/components/PaypalSubscribeButton";
import { UsageLineChart } from "@/components/UsageLineChart";


export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{error?: string, success?: string, loading?: boolean}>({});
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');
  const [activeSection, setActiveSection] = useState<'dashboard' | 'history' | 'stats'>('dashboard');
  const [summaryStyle, setSummaryStyle] = useState<'ejecutivo' | 'tecnico' | 'amigable'>('ejecutivo');


  // Cargar usuario y perfil
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      setUser(user);
      if (user) {
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (error && error.code === 'PGRST116') { // Not found
          // Crear perfil por defecto
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              plan_tier: 'free',
              minutes_processed_current_month: 0,
              monthly_minutes_limit: 60,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();
          setUserProfile(newProfile);
        } else {
          setUserProfile(profile);
        }
      }
    };
    fetchUserAndProfile();
  }, []);

  // Sync activeSection from query param `section`
  useEffect(() => {
    const section = searchParams?.get('section');
    if (section === 'history' || section === 'stats' || section === 'dashboard') {
      setActiveSection(section);
    }
  }, [searchParams]);
  // Lógica para guardar la suscripción PayPal en el backend
  const handlePaypalApprove = useCallback(
    async (subscriptionId: string) => {
      setFeedback({ loading: true });
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ subscriptionId, planTier: selectedPlan }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar la suscripción');
        setFeedback({ success: '¡Suscripción activada! Recarga la página para ver los cambios.' });
        // Opcional: recargar perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setUserProfile(profile);
      } catch (e: any) {
        setFeedback({ error: e.message || 'Ocurrió un error al guardar la suscripción.' });
      } finally {
        setFeedback(f => ({ ...f, loading: false }));
      }
    },
    [user, selectedPlan]
  );

  const fetchJobs = async (uid: string) => {
    setLoading(true);
    try {
      const jobs = await getUserJobs(uid);
      setJobs(jobs);
      // Refrescar perfil para estadísticas actualizadas
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .single();
      setUserProfile(profile);
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
  const handleUpload = async (file: File, title?: string) => {
    setFeedback({ loading: true });
    setTimeout(() => setFeedback({ error: 'La subida de archivos aún no está implementada. Usa un link público.' }), 500);
    setFeedback({ loading: false });
    // Aquí podrías implementar la subida real y pasar el título y summaryStyle
  };
  const handlePasteLink = async (url: string, title?: string) => {
    setFeedback({ loading: true });
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url, title, style: summaryStyle }),
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
        <div className="mt-10 text-lg text-secondary-600 dark:text-secondary-300">Debes iniciar sesión para ver tu dashboard.</div>
      </div>
    );
  }

  // Handlers (still used in-page UI)
  const handleSelectJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };
  const handleSettings = () => {
    setFeedback({ success: 'Ajustes próximamente.' });
    setTimeout(() => setFeedback({}), 2000);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };
  const handleNavigate = (section: 'dashboard' | 'history' | 'stats') => {
    setActiveSection(section);
  };

  // Render content based on active section
  const renderContent = () => {
    if (activeSection === 'stats') {
      return (
        <div className="animate-fade-in">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Estadísticas y Análisis</h1>
            <p className="text-secondary-600 dark:text-secondary-300 text-lg leading-relaxed">Visualiza el rendimiento y uso de tu cuenta</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card-hover p-8 text-center">
              <div className="text-5xl font-bold text-primary-600 mb-3">{jobs.length}</div>
              <div className="text-secondary-600 dark:text-secondary-300 font-semibold mb-4">Total Archivos</div>
              <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="card-hover p-8 text-center">
              <div className="text-5xl font-bold text-success-600 mb-3">{jobs.filter(j => j.status === 'completed').length}</div>
              <div className="text-secondary-600 dark:text-secondary-300 font-semibold mb-4">Completados</div>
              <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-success-500 to-success-600 h-2 rounded-full" style={{ width: `${jobs.length ? (jobs.filter(j => j.status === 'completed').length / jobs.length) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div className="card-hover p-8 text-center">
              <div className="text-5xl font-bold text-warning-600 mb-3">{jobs.filter(j => j.status === 'pending' || j.status === 'processing').length}</div>
              <div className="text-secondary-600 dark:text-secondary-300 font-semibold mb-4">En Proceso</div>
              <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-warning-500 to-warning-600 h-2 rounded-full" style={{ width: `${jobs.length ? (jobs.filter(j => j.status === 'pending' || j.status === 'processing').length / jobs.length) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div className="card-hover p-8 text-center">
              <div className="text-5xl font-bold text-danger-600 mb-3">{jobs.filter(j => j.status === 'failed').length}</div>
              <div className="text-secondary-600 dark:text-secondary-300 font-semibold mb-4">Errores</div>
              <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-danger-500 to-danger-600 h-2 rounded-full" style={{ width: `${jobs.length ? (jobs.filter(j => j.status === 'failed').length / jobs.length) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
          
          {/* Plan info */}
          <div className="card-hover p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 dark:text-secondary-100 mb-2">Plan Actual</h2>
                <div className="flex items-center gap-3">
                  <span className="badge badge-primary text-sm font-semibold capitalize">{userProfile?.plan_tier || 'free'}</span>
                  <span className="text-secondary-600 dark:text-secondary-300">
                    {userProfile ? Math.ceil((userProfile.minutes_processed_current_month || 0) / 60) : 0} / {userProfile?.monthly_minutes_limit || 60} minutos usados
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {userProfile ? Math.round(((userProfile.minutes_processed_current_month / 60) / userProfile.monthly_minutes_limit) * 100) : 0}%
                </div>
                <div className="text-secondary-500 dark:text-secondary-400 text-sm">Uso mensual</div>
              </div>
            </div>
            <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-500 shadow-glow" 
                style={{ width: `${userProfile ? ((userProfile.minutes_processed_current_month / 60) / userProfile.monthly_minutes_limit) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          {/* Usage over time chart */}
          <div className="card p-8">
            <h3 className="text-xl font-bold text-secondary-800 dark:text-secondary-100 mb-6">Uso a lo largo del tiempo</h3>
            <UsageLineChart jobs={jobs} />
          </div>
        </div>
      );
    }
    
    if (activeSection === 'history') {
      return (
        <div className="animate-fade-in">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Historial de Resúmenes</h1>
            <p className="text-secondary-600 dark:text-secondary-300 text-lg leading-relaxed">Gestiona y revisa todos tus resúmenes procesados</p>
          </div>
          {loading && jobs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-secondary-500 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                Cargando resúmenes...
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="card p-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-secondary-700 mb-2">No hay resúmenes aún</h3>
                <p className="text-secondary-500 mb-6">Comienza procesando tu primer video o audio</p>
                <button 
                  onClick={() => handleNavigate('dashboard')}
                  className="btn btn-primary"
                >
                  Crear primer resumen
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {jobs.map(job => (
                <EditableJobCard key={job.id} job={job} onShare={handleShare} onDownloadPDF={handleDownloadPDF} onDelete={handleDeleteJob} onUpdateTitle={async (newTitle: string) => {
                  await supabase.from('jobs').update({ title: newTitle }).eq('id', job.id);
                  fetchJobs(user.id);
                }} />
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // Default dashboard view
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-secondary-600 dark:text-secondary-300 text-lg leading-relaxed">Transforma tus videos y audios en resúmenes inteligentes con IA</p>
        </div>
        
        {/* Mostrar botón PayPal solo si el usuario es free */}
        {userProfile && userProfile.plan_tier === 'free' && (
          <div className="mb-8">
            <div className="card-hover p-6 text-center">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-secondary-800 mb-2">Actualiza tu Plan</h3>
                <p className="text-secondary-600">Obtén más minutos y funciones premium</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <button
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${selectedPlan === 'basic' ? 'bg-gradient-to-r from-warning-400 to-warning-500 text-white shadow-glow' : 'bg-secondary-50 dark:bg-secondary-900/60 text-secondary-700 dark:text-secondary-200 border border-secondary-300 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800'}`}
                  onClick={() => setSelectedPlan('basic')}
                >
                  Básico: 60 min/mes
                </button>
                <button
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${selectedPlan === 'pro' ? 'bg-gradient-to-r from-warning-400 to-warning-500 text-white shadow-glow' : 'bg-secondary-50 dark:bg-secondary-900/60 text-secondary-700 dark:text-secondary-200 border border-secondary-300 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800'}`}
                  onClick={() => setSelectedPlan('pro')}
                >
                  Pro: 300 min/mes
                </button>
              </div>
            {selectedPlan === 'basic' && (
              <PaypalSubscribeButton
                planId="P-33L930430F322933SNCZN4IQ" // Plan Básico real
                onApprove={handlePaypalApprove}
              />
            )}
            {selectedPlan === 'pro' && (
              <PaypalSubscribeButton
                planId="P-5X541101L03472358NCZN6VY" // Reemplaza por tu planId real (plan pro)
                onApprove={handlePaypalApprove}
              />
            )}
            </div>
          </div>
        )}
        
        <div className="mb-8 section-card">
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3 text-secondary-700 dark:text-secondary-200">Estilo de resumen</label>
            <select
              className="input w-full max-w-sm"
              value={summaryStyle}
              onChange={e => setSummaryStyle(e.target.value as 'ejecutivo' | 'tecnico' | 'amigable')}
              disabled={feedback.loading}
            >
              <option value="ejecutivo">Ejecutivo (Managers/Decisiones)</option>
              <option value="tecnico">Técnico (Producto/QA)</option>
              <option value="amigable">Amigable (Newsletter/Updates)</option>
            </select>
          </div>
          <UploadInput
            onUpload={handleUpload}
            onPasteLink={handlePasteLink}
            loading={feedback.loading}
            error={feedback.error}
            success={feedback.success}
            disabled={feedback.loading || (userProfile && Math.ceil((userProfile.minutes_processed_current_month || 0) / 60) >= (userProfile.monthly_minutes_limit || 60))}
            showTitleInput={true}
          />
          {userProfile && Math.ceil((userProfile.minutes_processed_current_month || 0) / 60) >= (userProfile.monthly_minutes_limit || 60) && (
            <div className="mt-4 p-4 bg-danger-50 border border-danger-200 rounded-xl">
              <div className="flex items-center gap-2 text-danger-700 font-semibold">
                <span className="text-lg">⚠️</span>
                Has alcanzado el límite de minutos procesados este mes
              </div>
            </div>
          )}
        </div>
        
        {/* Quick stats overview */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-secondary-800 dark:text-secondary-100">Métricas de Productividad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Resúmenes Completados */}
            <div className="card-hover p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-success-600 bg-success-100 px-2 py-1 rounded-full">
                  {jobs.length ? Math.round((jobs.filter(j => j.status === 'completed').length / jobs.length) * 100) : 0}%
                </span>
              </div>
              <div className="text-3xl font-bold text-secondary-800 dark:text-secondary-100 mb-1">
                {jobs.filter(j => j.status === 'completed').length}
              </div>
              <div className="text-secondary-600 dark:text-secondary-300 font-medium mb-3">Resúmenes Completados</div>
              <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-3">
                {(() => {
                  const completed = jobs.filter(j => j.status === 'completed');
                  const countSentences = (text?: string) => {
                    if (!text) return 0;
                    return text
                      .split(/(?<=[\.\!\?])\s+/)
                      .map(s => s.trim())
                      .filter(Boolean).length;
                  };
                  const totalSummarySentences = completed.reduce((acc, j) => acc + countSentences(j.ai_summary), 0);
                  const estimatedOriginalSentences = completed.reduce((acc, j) => {
                    if (j.raw_transcription && j.raw_transcription.length > 50) {
                      return acc + countSentences(j.raw_transcription);
                    }
                    // Estimar: 150 wpm, 15 palabras por frase => ~10 frases por minuto
                    const minutes = (j.duration_seconds || 0) / 60;
                    return acc + Math.round(minutes * 10);
                  }, 0);
                  return `${estimatedOriginalSentences} frases resumidas en ${totalSummarySentences || 0}`;
                })()}
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-success-500 to-success-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${jobs.length ? (jobs.filter(j => j.status === 'completed').length / jobs.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Uso del Plan */}
            <div className="card-hover p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
                  {userProfile ? Math.round(((userProfile.minutes_processed_current_month / 60) / userProfile.monthly_minutes_limit) * 100) : 0}%
                </span>
              </div>
              <div className="text-3xl font-bold text-secondary-800 dark:text-secondary-100 mb-1">
                {userProfile ? Math.ceil((userProfile.minutes_processed_current_month || 0) / 60) : 0}
                <span className="text-lg text-secondary-500 dark:text-secondary-400">/{userProfile?.monthly_minutes_limit || 60}</span>
              </div>
              <div className="text-secondary-600 dark:text-secondary-300 font-medium mb-3">Minutos Consumidos</div>
              <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-3">
                {(() => {
                  const used = userProfile ? Math.ceil((userProfile.minutes_processed_current_month || 0) / 60) : 0;
                  const limit = userProfile?.monthly_minutes_limit || 60;
                  const remaining = Math.max(limit - used, 0);
                  return `Te quedan ${remaining} minutos`;
                })()}
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${userProfile ? Math.min(((userProfile.minutes_processed_current_month / 60) / userProfile.monthly_minutes_limit) * 100, 100) : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Tiempo Ahorrado */}
            <div className="card-hover p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-accent-100 rounded-lg">
                  <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-accent-600 bg-accent-100 px-2 py-1 rounded-full">
                  {(() => {
                    const processedMinutes = userProfile ? Math.ceil((userProfile.minutes_processed_current_month || 0) / 60) : 0;
                    return processedMinutes > 0 ? 75 : 0; // Siempre 75% de ahorro
                  })()}%
                </span>
              </div>
              <div className="text-2xl font-bold text-secondary-800 dark:text-secondary-100 mb-1">
                {(() => {
                  const processedMinutes = userProfile ? Math.ceil((userProfile.minutes_processed_current_month || 0) / 60) : 0;
                  if (processedMinutes === 0) return "0 min de lectura";
                  
                  const readingTime = Math.round(processedMinutes * 0.25);
                  return `${readingTime} min de lectura`;
                })()}
              </div>
              <div className="text-sm text-secondary-500 dark:text-secondary-400 mb-3">
                de {userProfile ? Math.ceil((userProfile.minutes_processed_current_month || 0) / 60) : 0} min de video
              </div>
              <div className="text-secondary-600 dark:text-secondary-300 font-medium mb-3">Tiempo de Lectura vs Video</div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-accent-500 to-accent-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(() => {
                    const processedMinutes = userProfile ? Math.ceil((userProfile.minutes_processed_current_month || 0) / 60) : 0;
                    return processedMinutes > 0 ? '75%' : '0%';
                  })()}` }}
                ></div>
              </div>
            </div>

            {/* Eficiencia de Procesamiento */}
            <div className="card-hover p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-warning-600 bg-warning-100 px-2 py-1 rounded-full">
                  {(() => {
                    const completedJobs = jobs.filter(j => j.status === 'completed');
                    const totalMinutes = completedJobs.reduce((acc, job) => acc + (job.duration_seconds || 0), 0) / 60;
                    return totalMinutes > 0 && completedJobs.length > 0 ? Math.round((completedJobs.length / (totalMinutes / 60)) * 100) / 100 : 0;
                  })()}
                </span>
              </div>
              <div className="text-3xl font-bold text-secondary-800 dark:text-secondary-100 mb-1">
                {(() => {
                  const completedJobs = jobs.filter(j => j.status === 'completed');
                  const totalMinutes = completedJobs.reduce((acc, job) => acc + (job.duration_seconds || 0), 0) / 60;
                  if (totalMinutes > 0 && completedJobs.length > 0) {
                    const resumenesPerHour = completedJobs.length / (totalMinutes / 60);
                    return resumenesPerHour >= 1 ? resumenesPerHour.toFixed(1) : resumenesPerHour.toFixed(2);
                  }
                  return '0.0';
                })()}
                <span className="text-lg text-secondary-500 dark:text-secondary-400">/h</span>
              </div>
              <div className="text-secondary-600 dark:text-secondary-300 font-medium mb-3">Resúmenes por Hora</div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-warning-500 to-warning-600 h-2 rounded-full" 
                  style={{ width: `${(() => {
                    const completedJobs = jobs.filter(j => j.status === 'completed');
                    const totalMinutes = completedJobs.reduce((acc, job) => acc + (job.duration_seconds || 0), 0) / 60;
                    if (totalMinutes > 0 && completedJobs.length > 0) {
                      const efficiency = (completedJobs.length / (totalMinutes / 60));
                      return Math.min(efficiency * 20, 100); // Escala para visualización
                    }
                    return 0;
                  })()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <>{renderContent()}</>
  );
}
