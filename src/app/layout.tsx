'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import '@/lib/i18n'; // Importar configuración de i18n

const inter = Inter({ subsets: ['latin'] });

import DarkModeToggle from "@/components/DarkModeToggle";
import LanguageSelector from '@/components/LanguageSelector';
import AppShell from "@/components/layout/AppShell";
import { JobsProvider } from "@/contexts/JobsContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full`}>
        <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
          <LanguageSelector />
          <DarkModeToggle />
        </div>
        <JobsProvider>
          <AppShell>{children}</AppShell>
        </JobsProvider>
      </body>
    </html>
  );
}
