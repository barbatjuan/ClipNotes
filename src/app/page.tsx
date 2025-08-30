"use client";
import AuthForm from '@/components/AuthForm';
import { supabase } from '@/lib/supabase/client';
import Head from 'next/head';
import { CheckCircleIcon, LinkIcon, SparklesIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import Header from '@/components/layout/Header';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadInput } from '@/components/UploadInput';
import { SummaryDisplay } from '@/components/SummaryDisplay';
import { useFeedback } from '@/hooks/useFeedback';
import { urlSchema, fileSchema } from '@/utils/validation';

export default function Home() {
  const router = useRouter();
  const [summary, setSummary] = useState('');
  const [todoList, setTodoList] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [user, setUser] = useState<any>(null);
  const feedback = useFeedback();

  // Detectar usuario autenticado
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        router.push('/dashboard');
      }
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
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
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>ClipNotes - De Video a Notas en Segundos</title>
        <meta name="description" content="Tus Reuniones Grabadas, Convertidas en Notas Perfectas" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Header />

      {/* Hero Section Mejorada */}
      <section className="bg-gradient-to-b from-white to-gray-50 pb-16 pt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            <span className="block mb-2">Tus reuniones grabadas,</span>
            <span className="block text-primary drop-shadow">Convertidas en Notas Perfectas</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-lg md:text-2xl text-gray-600">
            Pega el link o sube tu archivo de Loom, Zoom, Meet o cualquier video/audio. Obtén una transcripción y un resumen accionable al instante.
          </p>
          {!user ? (
            <div className="my-6 text-gray-600 font-medium text-lg">
              Inicia sesión o crea una cuenta para usar el generador de resúmenes.
            </div>
          ) : (
            <div className="my-6 text-green-700 font-semibold text-lg">¡Bienvenido! Ya puedes generar tus resúmenes.</div>
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
              <div className="text-center text-gray-500 border border-dashed border-gray-300 rounded p-4 mt-4">
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
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Cómo funciona
          </h2>
          <div className="mt-10">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary">
                  <LinkIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-gray-900">1. Copia el link de tu grabación</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Obtén el enlace de tu video de Zoom, Google Meet, Loom o cualquier otra plataforma.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary">
                  <SparklesIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-gray-900">2. Pégalo en ClipNotes</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Nuestra IA procesará automáticamente el video y extraerá la información clave.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary">
                  <DocumentCheckIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-gray-900">3. Obtén tu transcripción y resumen</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Recibe una transcripción completa y un resumen con los puntos clave y acciones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Precios sencillos, sin sorpresas
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Empieza gratis y actualiza cuando lo necesites.
            </p>
          </div>

          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
            <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
              <div className="p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Gratis</h2>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">$0</span>
                  <span className="text-base font-medium text-gray-500">/mes</span>
                </p>
                <p className="mt-4 text-sm text-gray-500">
                  Perfecto para probar el servicio.
                </p>
                <button className="mt-8 block w-full bg-gray-800 border border-gray-800 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-gray-900">
                  Empezar gratis
                </button>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">Incluye</h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">30 minutos de procesamiento/mes</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">Resúmenes con IA</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">Historial de 30 días</p>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-2 border-primary rounded-lg shadow-sm divide-y divide-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">Pro</h2>
                  <p className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Popular
                  </p>
                </div>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">$7</span>
                  <span className="text-base font-medium text-gray-500">/mes</span>
                </p>
                <p className="mt-4 text-sm text-gray-500">
                  Ideal para uso profesional.
                </p>
                <button className="mt-8 block w-full bg-primary border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-primary/90">
                  Comenzar ahora
                </button>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">Todo en Gratis, más:</h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">120 minutos de procesamiento/mes</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">Resúmenes avanzados con IA</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">Historial ilimitado</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">Soporte prioritario</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              ¿Tienes alguna pregunta? Aquí están las respuestas a las preguntas más comunes.
            </p>
          </div>

          <div className="mt-12">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12">
              <div>
                <dt className="text-lg font-medium text-gray-900">
                  ¿Qué plataformas de video son compatibles?
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  ClipNotes funciona con enlaces públicos de Zoom, Google Meet, Loom, YouTube y la mayoría de plataformas de video. Si tu plataforma no está en la lista, ¡avísanos!
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">
                  ¿Cómo se maneja la privacidad de mis videos?
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  Tomamos tu privacidad muy en serio. Los videos se procesan de forma segura y se eliminan de nuestros servidores una vez generada la transcripción. No compartimos tu información con terceros.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">
                  ¿Qué tan precisas son las transcripciones?
                </dt>
                <dd className="mt-2 text-base text-gray-900">
                  Nuestro sistema de IA ofrece una precisión de aproximadamente 95-98% en condiciones ideales. La calidad del audio, los acentos fuertes o el ruido de fondo pueden afectar la precisión.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">
                  ¿Puedo probar el servicio antes de pagar?
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  ¡Claro! Ofrecemos un plan gratuito con 30 minutos de procesamiento al mes. Puedes probar todas las funciones sin necesidad de tarjeta de crédito.
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


