'use client';
import { useEffect, useState } from 'react';

const HEADLINES = [
  // Reuniones / Trabajo
  'Pega esa reunión eterna del viernes y resúmela en pocas líneas. Para terminar la semana en horario.',
  '¿Otra reunión que pudo ser un email? Conviértela en uno.',
  'Loomes que nadie ve. Resúmenes que todos leen.',
  'Deja de perder tiempo viendo grabaciones. Empieza a tener tardes libres.',
  'Tu equipo te lo agradecerá. (Y tu paz mental también).',

  // Estudio / Clases
  'Resume esa clase para el examen en puntos clave. Para no perderte toda la diversión del fin de semana.',
  'Apuntes de clase perfectos, sin tener que faltar a la fiesta.',
  '¿Te saltaste la clase? Nosotros la resumimos por ti.',
  'Tus maratones de estudio de 4 horas, convertidas en 4 minutos de lectura.',
  'Aprueba el examen sin sacrificar tu vida social.',

  // Contenido / Podcast / Entrevistas
  'Convierte tu podcast de 2 horas en un hilo de Twitter en 2 minutos.',
  'La mejor parte de tu entrevista, sin tener que editarla.',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function RotatingHeadline() {
  // Importante para SSR: que el primer render sea determinista
  const [headlines, setHeadlines] = useState<string[]>(HEADLINES);
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Mezclamos DESPUÉS de montar para evitar diferencias SSR/CSR
    setHeadlines((prev) => shuffle(prev));
    const interval = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % headlines.length);
        // Dejar que el DOM pinte y luego quitar el fade
        requestAnimationFrame(() => setFade(false));
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, [headlines.length]);

  return (
    <h2
      className={`text-lg md:text-xl text-center font-bold mt-4 transition-opacity duration-500 text-secondary-800 dark:text-white ${
        fade ? 'opacity-0' : 'opacity-100'
      }`}
      aria-live="polite"
    >
      {headlines[index]}
    </h2>
  );
}
