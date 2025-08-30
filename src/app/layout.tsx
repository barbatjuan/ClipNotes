import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClipNotes - De Video a Notas en Segundos',
  description: 'Tus Reuniones Grabadas, Convertidas en Notas Perfectas',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#4F46E5',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full bg-gray-50">
      <body className={`${inter.className} min-h-full`}>{children}</body>
    </html>
  );
}
