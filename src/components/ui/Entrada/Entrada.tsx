import type { ComponentPropsWithRef } from 'react';
import { clases } from '@/lib/clases';

interface EntradaProps extends ComponentPropsWithRef<'input'> {
  /** Fondo claro para usar sobre superficies (--color-surface). */
  clara?: boolean;
}

/** Bloque BEM `entrada`: campos de texto, búsqueda y fecha. */
export function Entrada({ clara = false, className, ...resto }: EntradaProps) {
  return <input className={clases('entrada', clara && 'entrada--clara', className)} {...resto} />;
}
