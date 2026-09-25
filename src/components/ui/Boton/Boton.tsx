import type { ComponentPropsWithRef } from 'react';
import { clases } from '@/lib/clases';

export type VarianteBoton = 'primario' | 'secundario' | 'fantasma';

interface BotonProps extends ComponentPropsWithRef<'button'> {
  variante?: VarianteBoton;
  /** Botón cuadrado solo con ícono: requiere aria-label. */
  icono?: boolean;
}

/** Bloque BEM `boton`. */
export function Boton({ variante = 'secundario', icono = false, className, type = 'button', ...resto }: BotonProps) {
  return <button type={type} className={clases('boton', `boton--${variante}`, icono && 'boton--icono', className)} {...resto} />;
}
