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
    <header className="bg-white shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between border-b border-gray-200">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-primary">ClipNotes</span>
            </Link>
            {!user && (
              <div className="hidden ml-10 space-x-8 lg:block">
                <Link href="/#features" className="text-base font-medium text-gray-500 hover:text-gray-900">
                  Cómo funciona
                </Link>
                <Link href="/#pricing" className="ml-8 text-base font-medium text-gray-500 hover:text-gray-900">
                  Precios
                </Link>
                <Link href="/#faq" className="ml-8 text-base font-medium text-gray-500 hover:text-gray-900">
                  Preguntas Frecuentes
                </Link>
              </div>
            )}
          </div>
          <div className="ml-10 space-x-4">
            {user ? (
              <button
                onClick={handleLogout}
                className="inline-block rounded-md border border-transparent bg-red-500 py-2 px-4 text-base font-medium text-white hover:bg-red-600"
              >
                Cerrar sesión
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowAuth(true)}
                  className="inline-block rounded-md border border-transparent bg-primary py-2 px-4 text-base font-medium text-white hover:bg-primary/90"
                >
                  Acceder
                </button>
                <button
                  onClick={() => setShowAuth(true)}
                  className="inline-block rounded-md border border-primary bg-white py-2 px-4 text-base font-medium text-primary hover:bg-gray-100 hover:border-primary ml-2"
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
