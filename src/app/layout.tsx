import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClipNotes - De Video a Notas en Segundos',
  description: 'Tus Reuniones Grabadas, Convertidas en Notas Perfectas',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4F46E5',
};

import DarkModeToggle from "@/components/DarkModeToggle";
import AppShell from "@/components/layout/AppShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full`}>
        <DarkModeToggle />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
