import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

// Tipografía institucional. next/font la descarga al compilar y la sirve desde el propio sitio.
const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fuente-montserrat',
});

export const metadata: Metadata = {
  title: 'Calendario institucional · Universidad de Cundinamarca',
  description: 'Actividades académicas, administrativas e institucionales de la Universidad de Cundinamarca.',
};

export const viewport: Viewport = {
  themeColor: '#007B3E',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es-CO" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
