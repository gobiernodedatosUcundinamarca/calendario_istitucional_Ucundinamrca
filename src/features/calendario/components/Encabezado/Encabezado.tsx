import Image from 'next/image';
import type { ReactNode } from 'react';
import escudo from '@/assets/escudo-ucundinamarca.png';

interface EncabezadoProps {
  subtitulo: string;
  /** Acciones a la derecha (Exportar, Filtros…). */
  children?: ReactNode;
}

/** Bloque BEM `encabezado`: escudo, título y acciones globales. */
export function Encabezado({ subtitulo, children }: EncabezadoProps) {
  return (
    <header className="encabezado">
      <Image className="encabezado__escudo" src={escudo} width={35} height={52} alt="Escudo Universidad de Cundinamarca" loading="eager" />
      <div className="encabezado__marca">
        <h1 className="encabezado__titulo">Calendario institucional</h1>
        <span className="encabezado__subtitulo">{subtitulo}</span>
      </div>
      {children && <div className="encabezado__acciones">{children}</div>}
    </header>
  );
}
