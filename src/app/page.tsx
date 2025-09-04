"use client";
import AuthForm from '@/components/AuthForm';
import { supabase } from '@/lib/supabase/client';
import Head from 'next/head';
import { CheckCircleIcon, LinkIcon, SparklesIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

import { PaypalSubscribeButton } from '@/components/PaypalSubscribeButton';
import Header from '@/components/layout/Header';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadInput } from '@/components/UploadInput';
import { SummaryDisplay } from '@/components/SummaryDisplay';
import RotatingText from '@/components/RotatingText';
import { RotatingHeadline } from '@/components/RotatingHeadline';
import { useFeedback } from '@/hooks/useFeedback';
import { urlSchema, fileSchema } from '@/utils/validation';

export default function Home() {
  const router = useRouter();
  const [summary, setSummary] = useState('');
  const [todoList, setTodoList] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [user, setUser] = useState<any>(null);
  const feedback = useFeedback();
  const [showPaypal, setShowPaypal] = useState<'basic' | 'pro' | 'enterprise' | null>(null);

  // Detectar usuario autenticado
  useEffect(() => {
    let isRedirecting = false;
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      if (data.session?.user && !isRedirecting) {
        isRedirecting = true;
        router.push('/dashboard');
      }
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && !isRedirecting) {
        isRedirecting = true;
        router.push('/dashboard');
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  // Integración real con OpenAI vía API local
  // Nuevo flujo: encolar job
  const summarize = async (input: { url?: string; file?: File }) => {
    feedback.reset();
    feedback.setLoading(true);
    try {
      let url = '';
      if (input.file) {
        feedback.setError('La subida de archivos aún no está implementada en el flujo asíncrono. Usa un link público.');
        feedback.setLoading(false);
        return;
      } else if (input.url) {
        url = input.url;
      }
      if (!url) throw new Error('No hay link para procesar');
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
      feedback.setSuccess('¡Tu video está encolado! El resumen aparecerá en tu dashboard cuando esté listo.');
      setSummary('');
      setTodoList([]);
      setNotes('');
    } catch (e: any) {
      feedback.setError(e.message || 'Ocurrió un error al procesar el contenido.');
    } finally {
      feedback.setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    const result = fileSchema.safeParse(file);
    if (!result.success) {
      feedback.setError(result.error.issues[0].message);
      return;
    }
    await summarize({ file });
  };

  const handlePasteLink = async (url: string) => {
    const result = urlSchema.safeParse(url);
    if (!result.success) {
      feedback.setError(result.error.issues[0].message);
      return;
    }
    await summarize({ url });
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <Head>
        <title>ClipNotes - De Video a Notas en Segundos</title>
        <meta name="description" content="Tus Reuniones Grabadas, Convertidas en Notas Perfectas" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Header />

      {/* Hero Section Mejorada */}
      <section className="bg-gradient-to-b from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-800 pb-16 pt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-secondary-900 dark:text-white leading-tight">
            <span className="block mb-2 h-[1.2em]" aria-live="polite">
              Tus <RotatingText words={['reuniones', 'clases', 'entrevistas']} className="text-primary-500" /> grabadas,
            </span>
            <span className="block text-secondary-900 dark:text-white drop-shadow">Convertidas en Notas Perfectas</span>
          </h1>
          <RotatingHeadline />
          <p className="mt-6 max-w-xl mx-auto text-lg md:text-2xl text-secondary-600 dark:text-secondary-300">
            Pega un link o sube un archivo de Zoom, Meet o Loom. Transcripción y resumen al instante.
          </p>
          {user && (
            <div className="my-6 text-success-600 dark:text-success-400 font-semibold text-lg">¡Bienvenido! Ya puedes generar tus resúmenes.</div>
          )}
          <div className="mt-10 max-w-xl mx-auto">
            <UploadInput
              onUpload={handleUpload}
              onPasteLink={handlePasteLink}
              loading={feedback.loading}
              error={feedback.error || undefined}
              success={feedback.success || undefined}
              disabled={!user}
            />
            {!user && (
              <div className="text-center text-secondary-500 dark:text-secondary-400 border border-dashed border-secondary-300 dark:border-secondary-700 rounded p-4 mt-4">
                Inicia sesión o crea una cuenta para usar el generador de resúmenes.
              </div>
            )}
          </div>
          {summary && (
            <div className="mt-10">
              <SummaryDisplay summary={summary} todoList={todoList} notes={notes} />
            </div>
          )}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="how-it-works" className="py-16 bg-secondary-50 dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-secondary-900 dark:text-white text-center mb-12">
            Cómo funciona
          </h2>
          <div className="mt-10">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary-500/10 text-primary-500">
                  <LinkIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-secondary-900 dark:text-white">1. Copia el link de tu grabación</h3>
                  <p className="mt-2 text-base text-secondary-600 dark:text-secondary-400">
                    Obtén el enlace de tu video de Zoom, Google Meet, Loom o cualquier otra plataforma.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary-500/10 text-primary-500">
                  <SparklesIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-secondary-900 dark:text-white">2. Pégalo en ClipNotes</h3>
                  <p className="mt-2 text-base text-secondary-600 dark:text-secondary-400">
                    Nuestra IA procesará automáticamente el video y extraerá la información clave.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary-500/10 text-primary-500">
                  <DocumentCheckIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-secondary-900 dark:text-white">3. Obtén tu transcripción y resumen</h3>
                  <p className="mt-2 text-base text-secondary-600 dark:text-secondary-400">
                    Recibe una transcripción completa y un resumen con los puntos clave y acciones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="pricing" className="py-16 bg-secondary-50 dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-secondary-900 dark:text-white sm:text-4xl">
              Planes y precios
            </h2>
            <p className="mt-4 text-xl text-secondary-600 dark:text-secondary-400">
              Elige el plan que se adapta a tus necesidades. Sin plan gratis, sin sorpresas.
            </p>
          </div>

          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-5xl lg:mx-auto xl:max-w-none xl:mx-0">
            {/* Plan Starter */}
            <div className="border border-secondary-300 rounded-lg shadow-soft bg-white/70 dark:bg-secondary-900/50 backdrop-blur divide-y divide-secondary-200 dark:divide-secondary-800">
              <div className="p-6">
                <h2 className="text-lg leading-6 font-medium text-secondary-900 dark:text-white">Starter</h2>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-secondary-700 dark:text-secondary-300">$5</span>
                  <span className="text-base font-medium text-secondary-600 dark:text-secondary-400">/mes</span>
                </p>
                <p className="mt-4 text-sm text-secondary-600 dark:text-secondary-400">
                  60 minutos de procesamiento al mes.
                </p>
                <button
                  className="mt-8 block w-full bg-secondary-200 border border-secondary-300 rounded-md py-2 text-sm font-semibold text-secondary-900 text-center hover:bg-secondary-300 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-100 dark:hover:bg-secondary-700"
                  onClick={() => setShowPaypal('basic')}
                >
                  Elegir Starter
                </button>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-secondary-900 dark:text-white tracking-wide uppercase">Incluye</h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">60 minutos de procesamiento/mes</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">Resúmenes con IA</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">Historial de 30 días</p>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-2 border-warning-500 rounded-lg shadow-soft bg-warning-50/70 dark:bg-warning-500/20 backdrop-blur divide-y divide-secondary-200 dark:divide-secondary-800 relative overflow-hidden">
              <div className="absolute top-5 -right-8 z-10">
                <div className="bg-warning-500 text-white text-xs font-bold px-10 py-1.5 transform rotate-45 origin-center shadow-lg">
                  POPULAR
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg leading-6 font-medium text-secondary-900 dark:text-white">Premium</h2>
                </div>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-secondary-900 dark:text-white">$19</span>
                  <span className="text-base font-medium text-secondary-600 dark:text-secondary-400">/mes</span>
                </p>
                <p className="mt-4 text-sm text-secondary-600 dark:text-secondary-400">
                  300 minutos de procesamiento al mes.
                </p>
                <button
                  className="mt-8 block w-full bg-warning-500 border border-warning-500 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-warning-600"
                  onClick={() => setShowPaypal('pro')}
                >
                  Elegir Premium
                </button>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-secondary-900 dark:text-white tracking-wide uppercase">Incluye</h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-success-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">300 minutos de procesamiento/mes</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-success-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">Resúmenes avanzados con IA</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-success-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">Historial ilimitado</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-success-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">Distintos tipos de resumen: Ejecutivo, Técnico y Amigable</p>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-2 border-primary-500 rounded-lg shadow-glow bg-white/80 dark:bg-secondary-900/60 backdrop-blur divide-y divide-secondary-200 dark:divide-secondary-800">
              <div className="p-6">
                <h2 className="text-lg leading-6 font-medium text-secondary-900 dark:text-white">Enterprise</h2>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-secondary-900 dark:text-white">$39</span>
                  <span className="text-base font-medium text-secondary-600 dark:text-secondary-400">/mes</span>
                </p>
                <p className="mt-4 text-sm text-secondary-600 dark:text-secondary-400">
                  600 minutos de procesamiento al mes.
                </p>
                <button
                  className="mt-8 block w-full bg-primary-500 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-primary-600"
                  onClick={() => setShowPaypal('enterprise')}
                >
                  Elegir Enterprise
                </button>
      {/* Modal PayPal */}
      {showPaypal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-soft-lg p-8 max-w-md w-full relative border border-secondary-200/60 dark:border-secondary-800/60">
            <button
              className="absolute top-2 right-2 text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200 text-xl"
              onClick={() => setShowPaypal(null)}
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-4 text-center text-secondary-900 dark:text-white">Completa tu suscripción</h3>
            {showPaypal === 'basic' && (
              <PaypalSubscribeButton
                planId="P-33L930430F322933SNCZN4IQ" // Plan Básico real
                onApprove={() => { setShowPaypal(null); window.location.href = '/dashboard'; }}
              />
            )}
            {showPaypal === 'pro' && (
              <PaypalSubscribeButton
                planId="P-5X541101L03472358NCZN6VY" // Reemplaza por tu planId real (pro)
                onApprove={() => { setShowPaypal(null); window.location.href = '/dashboard'; }}
              />
            )}
            {showPaypal === 'enterprise' && (
              <PaypalSubscribeButton
                planId="P-69007670NR021894UNC4I6CI" // Plan Enterprise real
                onApprove={() => { setShowPaypal(null); window.location.href = '/dashboard'; }}
              />
            )}
          </div>
        </div>
      )}
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-secondary-900 dark:text-white tracking-wide uppercase">Incluye</h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-success-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">600 minutos de procesamiento/mes</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-success-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">Resúmenes avanzados con IA</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-success-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">Historial ilimitado</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-success-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">Soporte prioritario</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-success-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">Traducción automática de resúmenes</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-success-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-secondary-700 dark:text-secondary-300">Envío de resúmenes por correo automático</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-secondary-50 dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-3xl font-extrabold text-secondary-900 dark:text-white sm:text-4xl">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-secondary-600 dark:text-secondary-400 lg:mx-auto">
              ¿Tienes alguna pregunta? Aquí están las respuestas a las preguntas más comunes.
            </p>
          </div>

          <div className="mt-12">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12">
              <div>
                <dt className="text-lg font-medium text-secondary-900 dark:text-white">
                  ¿Qué plataformas de video son compatibles?
                </dt>
                <dd className="mt-2 text-base text-secondary-600 dark:text-secondary-400">
                  ClipNotes funciona con enlaces públicos de Zoom, Google Meet, Loom, YouTube y la mayoría de plataformas de video. Si tu plataforma no está en la lista, ¡avísanos!
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-secondary-900 dark:text-white">
                  ¿Cómo se maneja la privacidad de mis videos?
                </dt>
                <dd className="mt-2 text-base text-secondary-600 dark:text-secondary-400">
                  Tomamos tu privacidad muy en serio. Los videos se procesan de forma segura y se eliminan de nuestros servidores una vez generada la transcripción. No compartimos tu información con terceros.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-secondary-900 dark:text-white">
                  ¿Qué tan precisas son las transcripciones?
                </dt>
                <dd className="mt-2 text-base text-secondary-900 dark:text-secondary-300">
                  Nuestro sistema de IA ofrece una precisión de aproximadamente 95-98% en condiciones ideales. La calidad del audio, los acentos fuertes o el ruido de fondo pueden afectar la precisión.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-secondary-900 dark:text-white">
                  ¿Puedo probar el servicio antes de pagar?
                </dt>
                <dd className="mt-2 text-base text-secondary-600 dark:text-secondary-400">
                  Ofrecemos el plan Starter por $5/mes con 60 minutos de procesamiento. Ideal para probar todas las funciones sin compromiso.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      {/* Puedes agregar aquí una sección de llamada a la acción final si lo deseas */}

    </div>
  );
}


