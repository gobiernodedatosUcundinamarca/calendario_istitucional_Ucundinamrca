import type { ReactNode } from 'react';
import { clases } from '@/lib/clases';

export type VarianteInsignia = 'contorno' | 'acento' | 'acento-2' | 'neutra';

interface InsigniaProps {
  variante: VarianteInsignia;
  className?: string;
  children: ReactNode;
}

/** Bloque BEM `insignia`: etiqueta corta de estado. */
export function Insignia({ variante, className, children }: InsigniaProps) {
  return <span className={clases('insignia', `insignia--${variante}`, className)}>{children}</span>;
}
