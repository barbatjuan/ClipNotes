"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';


export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowAuth(false);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-secondary-950/60 backdrop-blur-md border-b border-secondary-200/60 dark:border-secondary-800/60">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400 tracking-tight">ClipNotes</span>
            </Link>
            {!user && (
              <div className="hidden ml-10 space-x-8 lg:block">
                <Link href="/#features" className="text-sm font-medium text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white">
                  Cómo funciona
                </Link>
                <Link href="/#pricing" className="ml-8 text-sm font-medium text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white">
                  Precios
                </Link>
                <Link href="/#faq" className="ml-8 text-sm font-medium text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white">
                  Preguntas Frecuentes
                </Link>
              </div>
            )}
          </div>
          <div className="ml-10 space-x-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="btn btn-danger"
              >
                Cerrar sesión
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowAuth(true)}
                  className="btn btn-primary"
                >
                  Acceder
                </button>
                <button
                  onClick={() => setShowAuth(true)}
                  className="btn btn-secondary"
                >
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </header>
  );
}
