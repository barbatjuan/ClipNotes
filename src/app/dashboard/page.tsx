"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getUserJobs } from "@/lib/supabase/jobs";
import { CheckCircleIcon, ClockIcon, XCircleIcon, ClipboardIcon, TrashIcon, ArrowDownTrayIcon, LinkIcon } from "@heroicons/react/24/outline";
import EditableJobCard from "./EditableJobCard";
import jsPDF from "jspdf";
import Header from "@/components/layout/Header";
import { UploadInput } from "@/components/UploadInput";
import { SummaryDisplay } from "@/components/SummaryDisplay";
import { PaypalSubscribeButton } from "@/components/PaypalSubscribeButton";


export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{error?: string, success?: string, loading?: boolean}>({});
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');
  const [activeSection, setActiveSection] = useState<'dashboard' | 'history' | 'stats'>('dashboard');


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
    // Aquí podrías implementar la subida real y pasar el título
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
        body: JSON.stringify({ url, title }),
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

  // Sidebar integration and new dashboard layout
  // Lazy import to avoid SSR issues if needed
  const Sidebar = require("@/components/layout/Sidebar").default;

  // Handlers for Sidebar actions
  const handleSelectJob = (jobId: string) => {
    // Could scroll to job or highlight, for now do nothing
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
        <div>
          <h1 className="text-4xl font-extrabold mb-4 text-primary drop-shadow">Estadísticas y Gráficas</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100">
              <div className="text-4xl font-bold text-primary mb-2">{jobs.length}</div>
              <div className="text-gray-500 font-medium">Total Archivos</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100">
              <div className="text-4xl font-bold text-green-600 mb-2">{jobs.filter(j => j.status === 'completed').length}</div>
              <div className="text-gray-500 font-medium">Completados</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${jobs.length ? (jobs.filter(j => j.status === 'completed').length / jobs.length) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100">
              <div className="text-4xl font-bold text-yellow-500 mb-2">{jobs.filter(j => j.status === 'pending' || j.status === 'processing').length}</div>
              <div className="text-gray-500 font-medium">En Proceso</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${jobs.length ? (jobs.filter(j => j.status === 'pending' || j.status === 'processing').length / jobs.length) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100">
              <div className="text-4xl font-bold text-red-500 mb-2">{jobs.filter(j => j.status === 'failed').length}</div>
              <div className="text-gray-500 font-medium">Errores</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${jobs.length ? (jobs.filter(j => j.status === 'failed').length / jobs.length) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
          
          {/* Plan info */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Plan Actual</h2>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-semibold capitalize">{userProfile?.plan_tier || 'free'}</span>
                <div className="text-sm text-gray-500">
                  {userProfile?.minutes_processed_current_month || 0} / {userProfile?.monthly_minutes_limit || 60} minutos usados este mes
                </div>
              </div>
              <div className="w-32">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${userProfile ? (userProfile.minutes_processed_current_month / userProfile.monthly_minutes_limit) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Usage over time chart placeholder */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Uso en el Tiempo</h2>
            <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-lg font-medium">Gráfica de uso mensual</div>
                <div className="text-gray-500 text-sm mt-2">Próximamente disponible</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (activeSection === 'history') {
      return (
        <div>
          <h1 className="text-4xl font-extrabold mb-4 text-primary drop-shadow">Historial de Resúmenes</h1>
          {loading && jobs.length === 0 ? (
            <div className="text-gray-500">Cargando...</div>
          ) : jobs.length === 0 ? (
            <div className="text-gray-400">No tienes resúmenes procesados aún.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
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
      <div>
        <h1 className="text-4xl font-extrabold mb-4 text-primary drop-shadow">Dashboard</h1>
        <p className="mb-8 text-gray-600 text-lg">Pega el link de tu video o audio para generar un resumen con IA. También puedes ver tu historial y estadísticas.</p>
        
        {/* Mostrar botón PayPal solo si el usuario es free */}
        {userProfile && userProfile.plan_tier === 'free' && (
          <div className="mb-8">
            <div className="mb-2 text-center text-yellow-700 font-semibold">Elige tu plan y suscríbete para más minutos y prioridad:</div>
            <div className="flex flex-col md:flex-row gap-4 justify-center mb-4">
              <button
                className={`px-4 py-2 rounded border font-bold transition-all ${selectedPlan === 'basic' ? 'bg-yellow-400 border-yellow-600 text-yellow-900' : 'bg-white border-gray-300 text-gray-700 hover:bg-yellow-100'}`}
                onClick={() => setSelectedPlan('basic')}
              >
                Básico: 60 min/mes
              </button>
              <button
                className={`px-4 py-2 rounded border font-bold transition-all ${selectedPlan === 'pro' ? 'bg-yellow-400 border-yellow-600 text-yellow-900' : 'bg-white border-gray-300 text-gray-700 hover:bg-yellow-100'}`}
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
        )}
        
        <div className="mb-8">
          <UploadInput
            onUpload={handleUpload}
            onPasteLink={handlePasteLink}
            loading={feedback.loading}
            error={feedback.error}
            success={feedback.success}
            disabled={feedback.loading}
            showTitleInput={true}
          />
        </div>
        
        {/* Quick stats overview */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Resumen Rápido</h2>
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
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-gray-50 to-white">
      <Sidebar
        jobs={jobs}
        onSelectJob={handleSelectJob}
        onSettings={handleSettings}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        user={user}
        activeSection={activeSection}
      />
      <main className="flex-1 ml-72 py-10 px-8">
        {renderContent()}
      </main>
    </div>
  );
}
