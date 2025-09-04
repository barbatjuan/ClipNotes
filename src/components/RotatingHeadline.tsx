'use client';
import { useEffect, useState, useCallback } from 'react';

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
  const [currentHeadline, setCurrentHeadline] = useState(HEADLINES[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shuffledHeadlines] = useState(() => shuffle(HEADLINES));

  const rotateHeadline = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      const currentIndex = shuffledHeadlines.indexOf(currentHeadline);
      const nextIndex = (currentIndex + 1) % shuffledHeadlines.length;
      setCurrentHeadline(shuffledHeadlines[nextIndex]);
      requestAnimationFrame(() => setIsAnimating(false));
    }, 500);
  }, [currentHeadline, shuffledHeadlines]);

  useEffect(() => {
    const interval = setInterval(rotateHeadline, 5000);
    return () => clearInterval(interval);
  }, [rotateHeadline]);

  return (
    <h2
      className={`text-lg md:text-xl text-center font-bold mt-4 transition-opacity duration-500 text-primary-500 dark:text-primary-400 ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
      aria-live="polite"
    >
      {currentHeadline}
    </h2>
  );
}
