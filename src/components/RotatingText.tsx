"use client";
import { useState, useEffect } from 'react';

interface RotatingTextProps {
  words: string[];
  interval?: number;
  className?: string;
}

export default function RotatingText({ words, interval = 3000, className = "" }: RotatingTextProps) {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let index = 0;
    
    const tick = () => {
      setIsAnimating(true);
      setTimeout(() => {
        index = (index + 1) % words.length;
        setCurrentWord(words[index]);
        requestAnimationFrame(() => setIsAnimating(false));
      }, 200);
    };
    
    const intervalId = setInterval(tick, interval);
    return () => clearInterval(intervalId);
  }, [words, interval]);

  return (
    <span
      className={`inline-block transition-all duration-200 ${
        isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      } ${className}`}
    >
      {currentWord}
    </span>
  );
}
