"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';


export default function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setSuccess('¡Revisa tu email para confirmar tu cuenta!');
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else {
      setSuccess('¡Bienvenido!');
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const handleGoogle = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow mt-8">
      <h2 className="text-xl font-bold mb-4 text-center">Accede a tu cuenta</h2>
      <form className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <div className="flex gap-2">
          <button
            type="submit"
            onClick={handleSignIn}
            className="flex-1 bg-primary text-white py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            className="flex-1 bg-gray-200 text-primary py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            Registrarse
          </button>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <button
            type="button"
            onClick={handleGoogle}
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded shadow hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.82 2.7 30.28 0 24 0 14.82 0 6.71 5.82 2.69 14.09l7.98 6.2C12.33 13.13 17.67 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.03l7.19 5.59C43.99 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.29c-1.01-2.99-1.01-6.21 0-9.2l-7.98-6.2C.64 17.1 0 20.47 0 24c0 3.53.64 6.9 1.77 10.11l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.28 0 11.56-2.08 15.41-5.67l-7.19-5.59c-2.01 1.35-4.59 2.16-8.22 2.16-6.33 0-11.67-3.63-13.33-8.59l-7.98 6.2C6.71 42.18 14.82 48 24 48z"/></g></svg>
            Continuar con Google
          </button>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
      </form>
    </div>
  );
}
